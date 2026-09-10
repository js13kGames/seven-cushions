from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from pathlib import Path
import base64,re
patterns='''A:0E11111F111111 B:1E11111E11111E C:0F10101010100F D:1E11111111111E E:1F10101E10101F F:1F10101E101010 G:0F10101711110F H:1111111F111111 I:0E04040404040E J:0702020212120C K:11121418141211 L:1010101010101F M:111B1515111111 N:11191513111111 O:0E11111111110E P:1E11111E101010 Q:0E11111115120D R:1E11111E141211 S:0F10100E01011E T:1F040404040404 U:1111111111110E V:11111111110A04 W:11111115151B11 X:11110A040A1111 Y:11110A04040404 Z:1F01020408101F 0:0E11131519110E 1:040C040404040E 2:0E11010204081F 3:1E01010E01011E 4:02060A121F0202 5:1F10101E01011E 6:0E10101E11110E 7:1F010204080808 8:0E11110E11110E 9:0E11110F01010E .:00000000000C0C ,:00000000000408 ::00040400040400 !:04040404040004 ?:0E110102040004 -:0000001F000000 +:0004041F040400 /:01010204081010 (:02040808080402 ):08040202020408 %:19190204081313 =:00001F001F0000 ':04040800000000'''
glyphs={};mapping={};metrics={};order=['.notdef','space'];patterns=[x for x in patterns.split() if x[0] not in "%=\'()"]
for idx,entry in enumerate(patterns):
 char,data=entry.split(':',1) if not entry.startswith('::') else (':',entry[2:]);name='g'+str(idx);order.append(name);pen=TTGlyphPen(None)
 for row in range(7):
  bits=int(data[row*2:row*2+2],16);col=0
  while col<5:
   if not bits&(1<<(4-col)):col+=1;continue
   end=col+1
   while end<5 and bits&(1<<(4-end)):end+=1
   x=col*100;y=(6-row)*100;pen.moveTo((x,y));pen.lineTo((x,y+100));pen.lineTo((end*100,y+100));pen.lineTo((end*100,y));pen.closePath();col=end
 glyphs[name]=pen.glyph();metrics[name]=(600,0);mapping[ord(char)]=name

for name in order[:2]:glyphs[name]=TTGlyphPen(None).glyph();metrics[name]=(400,0)
mapping[32]='space';mapping[215]=mapping[ord('X')];mapping[183]=mapping[46]
f=FontBuilder(800,isTTF=True);f.setupGlyphOrder(order);f.setupCharacterMap(mapping);f.setupGlyf(glyphs);f.setupHorizontalMetrics(metrics);f.setupHorizontalHeader(ascent=750,descent=-50);f.setupNameTable({});f.setupOS2(sTypoAscender=750,sTypoDescender=-50,usWinAscent=750,usWinDescent=50);f.setupPost(keepGlyphNames=False);f.setupMaxp();f.font.flavor='woff2';f.save('pixel.woff2')

p=Path('game.source.html');s=p.read_text(encoding='utf-8');s=re.sub(r'data:font/woff2;base64,[A-Za-z0-9+/=]+','data:font/woff2;base64,'+base64.b64encode(Path('pixel.woff2').read_bytes()).decode(),s);p.write_text(s,encoding='utf-8')
