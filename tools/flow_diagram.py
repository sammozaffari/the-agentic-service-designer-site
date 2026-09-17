#!/usr/bin/env python3
"""Render a labelled pipeline diagram as SVG from a JSON spec, at a given width.
Spec: {"title","subtitle","width","lanes":[{"name","note","steps":[{"id","label","note","kind"}]}],
       "links":[[from,to,label]], "footer"}
kind: input | machine | human | store | output
Usage: flow_diagram.py spec.json out.svg"""
import json, sys, textwrap

INK="#111110"; SOFT="#3f3f3b"; MUTED="#6e6e69"; LINE="#bdbdb7"; TINT="#f4f3ee"
FILL={"input":"#ffffff","machine":"#eef2fb","human":"#fdf6e3","store":"#f4f3ee","output":"#eaf3ec"}
EDGE={"input":"#bdbdb7","machine":"#9fb0d4","human":"#ddc48a","store":"#bdbdb7","output":"#9fc3a6"}
esc=lambda s:str(s).replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
def wrap(s,w): return textwrap.wrap(str(s),w) or [""]

def render(spec):
    W=spec.get("width",1100); M=24; lanes=spec["lanes"]
    lane_label_w=138; gap=18
    cols=max(len(l["steps"]) for l in lanes)
    avail=W-2*M-lane_label_w-gap
    bw=(avail-gap*(cols-1))/cols
    chars=max(10,int(bw/6.6)); nchars=max(12,int(bw/5.5))
    o=[]; y=M
    o.append(f'<text x="{M}" y="{y+22}" font-family="Inter,Helvetica,Arial,sans-serif" font-size="21" font-weight="700" fill="{INK}">{esc(spec["title"])}</text>'); y+=32
    for ln in wrap(spec.get("subtitle",""),int(W/8.2)):
        o.append(f'<text x="{M}" y="{y+13}" font-family="Inter,Helvetica,Arial,sans-serif" font-size="12.5" fill="{MUTED}">{esc(ln)}</text>'); y+=17
    y+=16
    pos={}
    for li,lane in enumerate(lanes):
        heights=[]
        for st in lane["steps"]:
            ls=wrap(st["label"],chars); ns=wrap(st.get("note",""),nchars) if st.get("note") else []
            heights.append(16+len(ls)*16+(len(ns)*13+6 if ns else 0)+14)
        rh=max(heights+[58])
        o.append(f'<text x="{M}" y="{y+19}" font-family="Inter,Helvetica,Arial,sans-serif" font-size="12" font-weight="700" fill="{INK}">{esc(lane["name"])}</text>')
        for k,ln in enumerate(wrap(lane.get("note",""),20)):
            o.append(f'<text x="{M}" y="{y+35+k*13}" font-family="Inter,Helvetica,Arial,sans-serif" font-size="10.5" fill="{MUTED}">{esc(ln)}</text>')
        for si,st in enumerate(lane["steps"]):
            x=M+lane_label_w+gap+si*(bw+gap)
            k=st.get("kind","input")
            o.append(f'<rect x="{x:.1f}" y="{y}" width="{bw:.1f}" height="{rh}" rx="7" fill="{FILL[k]}" stroke="{EDGE[k]}"/>')
            pos[st["id"]]=(x,y,bw,rh)
            yy=y+21
            for ln in wrap(st["label"],chars):
                o.append(f'<text x="{x+11:.1f}" y="{yy}" font-family="Inter,Helvetica,Arial,sans-serif" font-size="12.5" font-weight="600" fill="{INK}">{esc(ln)}</text>'); yy+=16
            if st.get("note"):
                yy+=3
                for ln in wrap(st["note"],nchars):
                    o.append(f'<text x="{x+11:.1f}" y="{yy}" font-family="Inter,Helvetica,Arial,sans-serif" font-size="10.5" fill="{SOFT}">{esc(ln)}</text>'); yy+=13
        y+=rh+26
    for a,b,lbl in spec.get("links",[]):
        if a not in pos or b not in pos: continue
        ax,ay,aw,ah=pos[a]; bx,by,bw2,bh=pos[b]
        if abs(ay-by)<2:
            x1=ax+aw; x2=bx; yy=ay+ah/2
            o.append(f'<line x1="{x1:.1f}" y1="{yy}" x2="{x2-7:.1f}" y2="{yy}" stroke="{MUTED}" stroke-width="1.3"/>')
            o.append(f'<path d="M{x2-7:.1f},{yy-4} L{x2:.1f},{yy} L{x2-7:.1f},{yy+4}z" fill="{MUTED}"/>')
            if lbl: o.append(f'<text x="{(x1+x2)/2:.1f}" y="{yy-7}" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="10" fill="{MUTED}">{esc(lbl)}</text>')
        else:
            x1=ax+aw/2; y1=ay+ah; x2=bx+bw2/2; y2=by
            o.append(f'<path d="M{x1:.1f},{y1} C{x1:.1f},{y1+16} {x2:.1f},{y2-16} {x2:.1f},{y2-7}" fill="none" stroke="{MUTED}" stroke-width="1.3"/>')
            o.append(f'<path d="M{x2-4:.1f},{y2-7} L{x2:.1f},{y2} L{x2+4:.1f},{y2-7}z" fill="{MUTED}"/>')
            if lbl: o.append(f'<text x="{x2+8:.1f}" y="{(y1+y2)/2+3:.0f}" font-family="Inter,Helvetica,Arial,sans-serif" font-size="10" fill="{MUTED}">{esc(lbl)}</text>')
    key=[("machine","Machine step"),("human","Human step"),("store","Store"),("output","Output")]
    kx=M
    for k,lbl in key:
        o.append(f'<rect x="{kx}" y="{y-4}" width="11" height="11" rx="2" fill="{FILL[k]}" stroke="{EDGE[k]}"/>')
        o.append(f'<text x="{kx+17}" y="{y+5}" font-family="Inter,Helvetica,Arial,sans-serif" font-size="10.5" fill="{SOFT}">{esc(lbl)}</text>')
        kx+=len(lbl)*6.2+32
    y+=24
    if spec.get("footer"):
        for ln in wrap(spec["footer"],int(W/7.2)):
            o.append(f'<text x="{M}" y="{y+10}" font-family="Inter,Helvetica,Arial,sans-serif" font-size="10.5" fill="{MUTED}">{esc(ln)}</text>'); y+=14
    H=y+10
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="{esc(spec["title"])}"><rect width="{W}" height="{H}" fill="#fff"/>'+"".join(o)+"</svg>"

if __name__=="__main__":
    open(sys.argv[2],"w").write(render(json.load(open(sys.argv[1])))); print("wrote",sys.argv[2])
