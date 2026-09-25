import xml.etree.ElementTree as ET
import sys
import os
import requests
import json

def parse_offline_witsml(xml_path: str, post_to_api: bool = False, api_url: str = "http://localhost:3006/api/drilling/parse_witsml"):
    """
    Parses a local XML file containing WITSML trajectoryStation telemetry data
    and optionally streams it to the Omesham AI classification API.
    """
    if not os.path.exists(xml_path):
        print(f"Error: XML file '{xml_path}' not found.")
        return None
        
    try:
        # Read raw XML string from file first
        with open(xml_path, "r", encoding="utf-8") as f:
            xml_str = f.read()
        
        # Clean namespaces for easy tag parsing
        xml_clean = xml_str
        for ns in ["witsml:", 'xmlns:witsml="http://www.witsml.org/schemas/1series"']:
            xml_clean = xml_clean.replace(ns, "")
            
        clean_root = ET.fromstring(xml_clean)
        
        # Look for trajectory stations
        stations = clean_root.findall(".//trajectoryStation")
        if not stations:
            # Check if root itself is a station or if simple structure
            stations = [clean_root] if clean_root.tag == "trajectoryStation" else []
            
        if not stations:
            print("No trajectory stations found in the WITSML document.")
            return []
            
        parsed_data = []
        print(f"Successfully loaded WITSML document. Found {len(stations)} telemetry station(s).\n")
        
        for idx, station in enumerate(stations):
            def safe_float(tag, default=0.0):
                elem = station.find(f".//{tag}")
                if elem is None:
                    elem = station.find(tag)
                return float(elem.text) if elem is not None and elem.text else default
                
            depth = safe_float("md", 0.0)
            wob = safe_float("wob", 0.0)
            rpm = safe_float("rpm", 0.0)
            rop = safe_float("rop", 0.0)
            spp = safe_float("spp", 0.0)
            torque = safe_float("torque", 0.0)
            
            elem_bha = station.find(".//bhaState")
            if elem_bha is None:
                elem_bha = station.find("bhaState")
            bha_state = elem_bha.text if elem_bha is not None and elem_bha.text else "Rotating"
            
            elem_form = station.find(".//formation")
            if elem_form is None:
                elem_form = station.find("formation")
            formation_type = elem_form.text if elem_form is not None and elem_form.text else "Unknown"
            
            station_dict = {
                "depth_ft": depth,
                "wob_klbs": wob,
                "rpm": rpm,
                "rop_fph": rop,
                "spp_psi": spp,
                "torque_ftlbs": torque,
                "bha_state": bha_state,
                "formation_type": formation_type
            }
            parsed_data.append(station_dict)
            
            print(f"Station #{idx+1} [Depth: {depth:.1f} ft | WOB: {wob:.1f} klbs | RPM: {rpm:.1f} | SPP: {spp:.0f} psi | Torque: {torque:.0f} ft-lbs]")
            print(f"  └─ Formation: '{formation_type}' | BHA State: '{bha_state}'")
            
            if post_to_api:
                # Re-serialize this station back to standard XML for Omesham API ingestion
                xml_payload = f"""<?xml version="1.0" encoding="UTF-8"?>
                <witsml:trajectorys xmlns:witsml="http://www.witsml.org/schemas/1series" version="1.4.1.1">
                  <witsml:trajectory uidWell="Omesham-Offline" uid="Wellbore-Offline">
                    <witsml:trajectoryStation>
                      <witsml:md>{depth}</witsml:md>
                      <witsml:wob>{wob}</witsml:wob>
                      <witsml:rpm>{rpm}</witsml:rpm>
                      <witsml:rop>{rop}</witsml:rop>
                      <witsml:spp>{spp}</witsml:spp>
                      <witsml:torque>{torque}</witsml:torque>
                      <witsml:bhaState>{bha_state}</witsml:bhaState>
                      <witsml:formation>{formation_type}</witsml:formation>
                    </witsml:trajectoryStation>
                  </witsml:trajectory>
                </witsml:trajectorys>"""
                
                try:
                    res = requests.post(api_url, data=xml_payload.encode('utf-8'), headers={"Content-Type": "application/xml"})
                    if res.status_code == 200:
                        eval_data = res.json().get("evaluation", {})
                        if eval_data.get("is_anomaly"):
                            print(f"  ⚠️  [Omesham AI Alert]: {eval_data.get('proactive_alert')}")
                            print(f"  └─ Recommended Action: {eval_data.get('recommended_solution')}")
                        else:
                            print("  🟢  [Omesham AI Status]: Nominal operating envelope.")
                    else:
                        print(f"  ❌ API post failed (HTTP {res.status_code})")
                except Exception as e:
                    print(f"  ❌ Failed to communicate with Omesham API: {e}")
            print("-" * 70)
            
        return parsed_data
    except Exception as e:
        print(f"Failed to parse WITSML XML file: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 read_witsml_offline.py <path_to_xml> [--stream]")
        print("Example: python3 read_witsml_offline.py sample_station.xml --stream")
        sys.exit(1)
        
    xml_file = sys.argv[1]
    stream_to_api = "--stream" in sys.argv
    parse_offline_witsml(xml_file, post_to_api=stream_to_api)
