from scapy.all import sniff, IP, TCP, UDP, DNS, DNSQR
import threading
import time
import random

class NetworkSniffer:
    def __init__(self, simulation_mode=False):
        self.running = False
        self.captured_packets = []
        self.lock = threading.Lock()
        self.simulation_mode = simulation_mode
        self.threat_score = 0

    def start(self):
        self.running = True
        self.sniffer_thread = threading.Thread(target=self._sniff_loop, daemon=True)
        self.sniffer_thread.start()

    def _sniff_loop(self):
        # Strictly real sniffing. No simulation fallback.
        try:
            # Capturing on all interfaces. In a real tethering scenario, 
            # this catches traffic routing through the host.
            sniff(prn=self._process_packet, store=False, stop_filter=lambda x: not self.running)
        except Exception as e:
            print(f"Sniffing Error: {e}. Ensure you have permissions (sudo) or a valid interface.")
            # Do NOT switch to simulation. Just stop or retry.
            self.running = False

    def _process_packet(self, packet):
        if not self.running: return
        
        pkt_info = {
            "timestamp": time.time(),
            "src": packet[IP].src if IP in packet else "Unknown",
            "dst": packet[IP].dst if IP in packet else "Unknown",
            "protocol": "TCP" if TCP in packet else "UDP" if UDP in packet else "Other",
            "length": len(packet),
            "threat": False
        }
        
        # Real Analysis: DNS Analysis
        if DNS in packet and packet.haslayer(DNSQR):
            qname = packet[DNSQR].qname.decode('utf-8', 'ignore')
            pkt_info["info"] = f"DNS: {qname}"
            # Real heuristic: long domains often indicate tunneling/DGA
            if len(qname) > 50: 
                pkt_info["threat"] = True
                self.threat_score += 10
        
        with self.lock:
            self.captured_packets.append(pkt_info)
            if len(self.captured_packets) > 500:
                self.captured_packets.pop(0)

    # _simulate_traffic removed entirely

    def get_packets(self):
        with self.lock:
            return list(self.captured_packets)

    def stop(self):
        self.running = False

sniffer = NetworkSniffer()
