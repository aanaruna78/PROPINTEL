import os
import re
import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage
from app.services import property_service, hdb_service, pulse_service

def process_chat_message(db: Session, request: ChatRequest, current_user: User) -> ChatResponse:
    """
    Orchestrate the chat response based on the presence of OPENAI_API_KEY.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        return _openai_chat(db, request, current_user, api_key)
    return _rule_based_chat(db, request, current_user)

# ─── OpenAI Path ────────────────────────────────────────────────────────────────

def _openai_chat(db: Session, request: ChatRequest, current_user: User, api_key: str) -> ChatResponse:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        # 1. Define LLM tools corresponding to internal services
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "search_properties",
                    "description": "Retrieve property projects. You can filter by district code (e.g. 'D01', 'D04', 'D15') and/or specific project names.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "district": {"type": "string", "description": "The district code (e.g. D01, D04)"},
                            "name": {"type": "string", "description": "Specific project name (e.g. Reflections, Marina One, The Sail)"}
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_hdb_market_intelligence",
                    "description": "Fetch market intelligence analytics for a Singapore HDB town and flat type (resale price, rental yield, days on market).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "town": {"type": "string", "description": "Singapore HDB Town (e.g. Ang Mo Kio, Bedok, Punggol, Tampines, Woodlands, Yishun)"},
                            "flat_type": {"type": "string", "description": "HDB flat size/type (e.g. 3-Room, 4-Room, 5-Room, Executive)"}
                        },
                        "required": ["town", "flat_type"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_market_pulse",
                    "description": "Fetch the overall Singapore market price index proxy, rising/cooling statistics, and current momentum.",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            }
        ]

        # 2. Construct messages list
        system_instructions = (
            f"You are PROPINTEL's AI Property Advisor, a senior Singapore real estate analyst.\n"
            f"You provide personalized property discoverability, valuation, and transaction advice.\n"
            f"The user is logged in as a: '{current_user.role}'. Tailor your tone and advice to their specific role.\n"
            f"Always use the provided tools to query property, HDB, or market data whenever possible.\n"
            f"Return a structured, data-driven response. Keep it concise, ending with a clear actionable takeaway.\n"
            f"Format response with proper markdown. Do not include placeholders."
        )

        messages = [{"role": "system", "content": system_instructions}]
        
        # Add history (last 10 messages)
        for msg in request.history[-10:]:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
            
        messages.append({
            "role": "user",
            "content": request.message
        })

        # 3. Call Chat Completion
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools,
            tool_choice="auto",
            temperature=0.6,
        )

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls
        
        intent = "general"
        metadata = {}

        # 4. Handle tool execution loop
        if tool_calls:
            # Add assistant message containing tool calls to context
            messages.append(response_message)
            
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                tool_result = None
                
                if function_name == "search_properties":
                    intent = "search_properties"
                    dist_param = function_args.get("district")
                    name_param = function_args.get("name")
                    
                    props = property_service.get_properties(db, district=dist_param)
                    if name_param:
                        props = [p for p in props if name_param.lower() in p["name"].lower()]
                    
                    tool_result = props
                    metadata["properties"] = props
                    
                elif function_name == "get_hdb_market_intelligence":
                    intent = "hdb_intel"
                    town_param = function_args.get("town")
                    flat_param = function_args.get("flat_type")
                    
                    intel = hdb_service.get_market_intelligence(db, town=town_param, flat_type=flat_param)
                    tool_result = intel
                    metadata["hdb_intel"] = intel
                    
                elif function_name == "get_market_pulse":
                    intent = "market_pulse"
                    pulse = pulse_service.get_market_pulse(db)
                    tool_result = pulse
                    metadata["market_pulse"] = pulse

                # Append tool result message
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": function_name,
                    "content": json.dumps(tool_result)
                })

            # Call completions again with tool outputs to get the final natural language answer
            second_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
            )
            final_text = second_response.choices[0].message.content
        else:
            final_text = response_message.content

        return ChatResponse(
            response=final_text.strip(),
            intent=intent,
            metadata=metadata if metadata else None
        )

    except Exception as e:
        print(f"[chat_service] OpenAI live agent path failed, using fallback: {e}")
        return _rule_based_chat(db, request, current_user)


# ─── Fallback Path (Local / Offline mode) ──────────────────────────────────────

def _rule_based_chat(db: Session, request: ChatRequest, current_user: User) -> ChatResponse:
    query = request.message.strip().lower()
    
    # 1. Resolve prior assistant response metadata for multi-turn dialogue context
    prev_intent = None
    prev_metadata = None
    
    for msg in reversed(request.history):
        if msg.role == "assistant" and msg.metadata:
            prev_metadata = msg.metadata
            if "properties" in msg.metadata:
                prev_intent = "search_properties"
            elif "hdb_intel" in msg.metadata:
                prev_intent = "hdb_intel"
            elif "market_pulse" in msg.metadata:
                prev_intent = "market_pulse"
            break

    # Extract indicators
    district_match = re.search(r"\b(d[0-2][0-9])\b", query)
    district = district_match.group(1).upper() if district_match else None
    
    project_name = None
    for name in ["reflections", "marina one", "the sail"]:
        if name in query:
            project_name = name
            break
            
    towns = ["Ang Mo Kio", "Bedok", "Punggol", "Tampines", "Woodlands", "Yishun"]
    town = None
    for t in towns:
        if t.lower() in query:
            town = t
            break
            
    flat_types = ["3-Room", "4-Room", "5-Room", "Executive"]
    flat_type = None
    for ft in flat_types:
        pattern = ft.lower().replace("-", r"[\s-]?")
        if re.search(pattern, query) or (ft.lower() == "executive" and "executive" in query):
            flat_type = ft
            break

    # ─── Context refinement path ───────────────────────────────────────────────
    
    # 2. Refinement query for rental yields or stats on previously shown properties
    if "rental yield" in query or "yield" in query:
        if prev_intent == "search_properties" and prev_metadata and "properties" in prev_metadata:
            props = prev_metadata["properties"]
            if props:
                prop = props[0]
                if "second" in query and len(props) > 1:
                    prop = props[1]
                elif "third" in query and len(props) > 2:
                    prop = props[2]
                
                name = prop.get("name")
                yield_val = prop.get("rental_yield_estimate", 4.2)
                psf_val = prop.get("fair_value_psf", 1800)
                
                response_text = (
                    f"### Rental Yield Analysis: **{name}**\n\n"
                    f"The estimated net rental yield for **{name}** is **{yield_val}%**.\n\n"
                    f"This is based on an average pricing of **SGD {psf_val:,.0f} PSF**. "
                    f"As an active **{current_user.role}**, this yield profile represents "
                    f"{'a highly competitive passive income signal' if yield_val >= 4.5 else 'a steady capital preservation asset'} "
                    f"relative to the general market baseline."
                )
                return ChatResponse(
                    response=response_text,
                    intent="search_properties",
                    metadata={"properties": [prop]}
                )
        elif prev_intent == "hdb_intel" and prev_metadata and "hdb_intel" in prev_metadata:
            intel = prev_metadata["hdb_intel"]
            town_name = intel.get("town")
            ft_type = intel.get("flat_type")
            yield_val = intel.get("rental_analysis", {}).get("rental_yield", 5.0)
            
            response_text = (
                f"### Rental Yield Analysis: HDB **{town_name}** ({ft_type})\n\n"
                f"The estimated rental yield in **{town_name}** for **{ft_type}** flats is **{yield_val}%**.\n\n"
                f"Driven by strong occupancy demand, this yield significantly outperforms the private condo baseline of 4.2%."
            )
            return ChatResponse(
                response=response_text,
                intent="hdb_intel",
                metadata={"hdb_intel": intel}
            )

    # 3. Refinement query for room size configurations on previous searches
    if "bedroom" in query or "br" in query or re.search(r"\b\d\s*(bed|room|br)\b", query):
        if prev_intent == "search_properties" and prev_metadata and "properties" in prev_metadata:
            props = prev_metadata["properties"]
            response_text = (
                f"### 3-Bedroom Sizing & Pricing Estimates\n\n"
                f"Filtering the previous property results for typical **3-Bedroom** layout prices:\n\n"
            )
            for p in props:
                est_price = p["fair_value_psf"] * 1000  # Assume 1000 sqft for 3br
                response_text += f"- **{p['name']}**: Avg 3-Bedroom units are valued at **SGD {est_price:,.0f}** (SGD {p['fair_value_psf']:.0f} PSF).\n"
            
            response_text += "\n*Note: Bedroom prices are derived using project average PSF against typical layout dimensions (1,000 sqft).* \n" \
                             "Add these properties to the Comparative Panel to review comprehensive details."
            return ChatResponse(
                response=response_text,
                intent="search_properties",
                metadata={"properties": props}
            )

    # ─── Direct intent matching path ───────────────────────────────────────────

    # 4. Intent: Market Pulse
    if any(kw in query for kw in ["pulse", "momentum", "trend", "overall market", "index", "market health"]):
        pulse = pulse_service.get_market_pulse(db)
        response_text = (
            f"### Singapore Real Estate Market Pulse\n\n"
            f"The overall market momentum is currently **{pulse['market_momentum'].upper()}**.\n\n"
            f"- **URA Price Index Proxy**: **{pulse['ura_property_index']}** ({pulse['ura_index_change']:+.2f}% MoM)\n"
            f"- **Average Condo Rental Yield**: **{pulse['avg_rental_yield']}%**\n"
            f"- **District Breadth**: {pulse['rising_count']} districts rising, {pulse['cooling_count']} cooling, and {pulse['stable_count']} stable.\n"
            f"- **Top District Mover**: **{pulse['top_mover']['district']}** ({pulse['top_mover']['name']}) showing **{pulse['top_mover']['price_movement_percent']:+.2f}%** price movement.\n\n"
            f"With neutral-to-bullish indicators, buyers should focus on districts experiencing short-term price dips."
        )
        return ChatResponse(
            response=response_text,
            intent="market_pulse",
            metadata={"market_pulse": pulse}
        )

    # 5. Intent: HDB Intelligence
    # Matches town, flat size, or general hdb keywords
    if "hdb" in query or "flat" in query or town or flat_type or (prev_intent == "hdb_intel" and (town or flat_type)):
        t_param = town or (prev_metadata.get("hdb_intel", {}).get("town") if prev_metadata and "hdb_intel" in prev_metadata else None) or "Tampines"
        ft_param = flat_type or (prev_metadata.get("hdb_intel", {}).get("flat_type") if prev_metadata and "hdb_intel" in prev_metadata else None) or "4-Room"
        
        intel = hdb_service.get_market_intelligence(db, town=t_param, flat_type=ft_param)
        trends = intel.get("resale_trends", [])
        latest = trends[-1] if trends else None
        
        response_text = (
            f"### HDB Market Intelligence: **{intel['town']} ({intel['flat_type']})**\n\n"
            f"Detailed metrics for **{intel['flat_type']}** units in **{intel['town']}**:\n\n"
            f"- **Average Resale Value**: **SGD {latest['avg_price'] if latest else 0:,.0f}** (SGD {latest['avg_psf'] if latest else 0:.0f} PSF)\n"
            f"- **Estimated Monthly Rent**: **SGD {intel['rental_analysis']['avg_rent'] if 'rental_analysis' in intel else 0:,.0f}/mo**\n"
            f"- **Estimated yield**: **{intel['rental_analysis']['rental_yield'] if 'rental_analysis' in intel else 0}%**\n"
            f"- **Transaction Velocity**: **{intel['liquidity']['rating']}** ({intel['liquidity']['avg_days_on_market']} avg days on market)\n\n"
            f"Based on a transaction volume of {latest['volume'] if latest else 0} sales this quarter, market demand remains stable."
        )
        return ChatResponse(
            response=response_text,
            intent="hdb_intel",
            metadata={"hdb_intel": intel}
        )

    # 6. Intent: Property Search
    # Matches district, project names, or general condo discovery keywords
    if district or project_name or any(kw in query for kw in ["condo", "project", "properties", "find", "search", "list", "discover", "apartment"]):
        d_param = district or (prev_metadata.get("properties", [{}])[0].get("district") if prev_metadata and "properties" in prev_metadata and prev_metadata["properties"] else None) or None
        
        props = property_service.get_properties(db, district=d_param)
        
        if project_name:
            props = [p for p in props if project_name.lower() in p["name"].lower()]
            
        if not props:
            # Default fallback when no specific matches exist
            props = property_service.get_properties(db)

        response_text = "### Discovered Property Projects\n\n"
        if d_param:
            response_text += f"Here are the property projects currently listed in **{d_param}**:\n\n"
        else:
            response_text += "Here are the top private property projects in Singapore:\n\n"

        for p in props:
            response_text += (
                f"- **{p['name']}** ({p['project_type']}): District {p['district']}, "
                f"Tenure: {p['tenure'] or 'N/A'}, Completion Year: {p['completion_year'] or 'N/A'}. "
                f"Fair value estimation: **SGD {p['fair_value_psf']:.0f} PSF**, Yield: **{p['rental_yield_estimate']}%**.\n"
            )
            
        response_text += "\nThese projects have been mapped in the interactive panel. You can select them for cross-comparison."
        return ChatResponse(
            response=response_text,
            intent="search_properties",
            metadata={"properties": props}
        )

    # 7. General / Greeting / Help text
    response_text = (
        f"Hello **{current_user.full_name}**! I am your AI Property Advisor.\n\n"
        f"I can help you navigate the Singapore real estate market. You can ask me to:\n"
        f"1. **Search Property Projects**: Try *'Find properties in D01'* or *'Show me Reflections at Keppel Bay'*.\n"
        f"2. **View HDB Market Intelligence**: Try *'Show HDB stats for Punggol 5-Room'* or *'What is Yishun 4-Room rental yield?'*.\n"
        f"3. **Analyze Market Trends**: Try *'What is the current market pulse?'* or *'Show overall market momentum'*.\n\n"
        f"Since you are logged in as a **{current_user.role}** account, I will customize my answers for you!"
    )
    return ChatResponse(
        response=response_text,
        intent="general",
        metadata=None
    )
