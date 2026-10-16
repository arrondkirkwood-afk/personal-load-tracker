(function enhancedAutoReport(root) {
  'use strict';
  const base = root.LoadTrackerCompleteWorkbook;
  if (!base || !root.document) return;
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const PALETTE = {navy:'17324D',teal:'137C8B',gold:'D6A84B',green:'2F855A',red:'C53030',ink:'23313D',light:'E8F3F4'};
  const CURRENCY = '$#,##0.00;[Red]-$#,##0.00';
  const NUMBER = '#,##0.00';
  const asNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const cash = value => Math.round((asNumber(value) + Number.EPSILON) * 100) / 100;
  function cellFormula(sheet, addr, formula, result, format) {
    const c = sheet.getCell(addr);
    c.value = {formula, result};
    if (format) c.numFmt = format;
    return c;
  }
  function getData() {
    const snapshot = root.getTrackerSnapshot?.();
    const clean = root.LoadTrackerExportCleanup;
    if (!snapshot || !clean) throw new Error('Tracker records are not ready. Try again after the app finishes loading.');
    const allLoads = clean.buildCleanLoadExport(snapshot);
    const allDaily = clean.buildCleanDailyEarningsExport(snapshot);
    const mode = root.document.getElementById('workbook-range-mode')?.value || 'current-pay-period';
    const start = root.document.getElementById('workbook-start-date')?.value || '';
    const end = root.document.getElementById('workbook-end-date')?.value || '';
    const range = base.determineRange(mode, start, end, allLoads, allDaily);
    if (range.end < range.start) throw new Error('The report end date cannot precede the start date.');
    const data = base.createDataset(snapshot, range);
    const settings = snapshot.data?.settings || {};
    const fair = Number(settings.fairDayGoal);
    const stretch = Number(settings.excellentDayGoal ?? settings.dailyCompletedLoadPayGoal);
    data.fairGoal = Number.isFinite(fair) && fair >= 0 ? fair : 250;
    data.excellentGoal = Number.isFinite(stretch) && stretch >= 0 ? stretch : 270;
    if (!data.dailyRows.length && !data.timingRows.length) throw new Error('There are no saved records in the selected date range.');
    return data;
  }
  function basicSheet(workbook, name, title, subtitle, headings) {
    const sh = workbook.addWorksheet(name,{views:[{state:'frozen',ySplit:5,showGridLines:false}],pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1}});
    const last = Math.max(8,headings.length);
    sh.mergeCells(1,1,1,last);
    const titleCell=sh.getCell('A1');titleCell.value=title;titleCell.font={name:'Aptos Display',size:19,bold:true,color:{argb:'FFFFFFFF'}};titleCell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+PALETTE.navy}};
    sh.getRow(1).height=36;
    sh.mergeCells(3,1,3,last);sh.getCell('A3').value=subtitle;sh.getCell('A3').font={italic:true,size:10,color:{argb:'FF607481'}};
    headings.forEach((label,i)=>{const c=sh.getCell(5,i+1);c.value=label;c.font={bold:true,color:{argb:'FFFFFFFF'},size:10};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+PALETTE.teal}};c.alignment={wrapText:true,vertical:'middle'};sh.getColumn(i+1).width=Math.max(13,Math.min(26,label.length+4));});
    sh.getRow(5).height=32;
    sh.autoFilter={from:{row:5,column:1},to:{row:5,column:headings.length}};
    return sh;
  }
  function addSettings(wb,d) {
    const sh=basicSheet(wb,'Settings','Report Settings','Goals are copied from the tracker. Editing these cells recalculates this downloaded workbook.',['Setting','Value','Purpose']);
    const rows=[
      ['Fair daily base-load goal',d.fairGoal,'Used to mark days at or below the Fair Goal'],
      ['Stretch daily base-load goal',d.excellentGoal,'Higher daily completed-load pay target'],
      ['Long workday threshold',14,'Highlights days that require duty-time review']
    ];
    rows.forEach((r,i)=>{const n=i+6;sh.getCell('A'+n).value=r[0];sh.getCell('B'+n).value=r[1];sh.getCell('C'+n).value=r[2];sh.getCell('B'+n).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF0B3'}};});
    sh.getCell('B6').numFmt=CURRENCY;sh.getCell('B7').numFmt=CURRENCY;sh.getCell('B8').numFmt=NUMBER;sh.getColumn(1).width=34;sh.getColumn(2).width=20;sh.getColumn(3).width=66;
    return sh;
  }
  function addPerformance(wb,d) {
    const h=['Work Date','Loads','Base Load Pay','Supplemental Load Pay','Per Diem','Other Hourly Pay','Other Pay Types','Calculated Earnings','Tracker Earnings','Recon. Difference','Duty Hours','Earnings / Duty Hr','Fair Goal','Stretch Goal','Base vs Fair','Fair Result','Stretch Result','14-Hour Review'];
    const sh=basicSheet(wb,'Daily Performance','Daily Earnings & Productivity',`${d.range.start} through ${d.range.end} · Formula-driven comparison against editable goals`,h);
    const n=d.dailyRows.length, dailyLast=n+5, loadLast=d.loads.rows.length+5;
    const summaries=[];
    for(let i=0;i<n;i++){
      const r=6+i,x=d.dailyRows[i],a=d.daily.rows[i],hds=d.daily.headers;
      const val=label=>asNumber(a[hds.indexOf(label)]);
      const sumLoad=(label)=>d.loads.rows.reduce((t,row)=>t+(row[0]===x.date?asNumber(row[d.loads.headers.indexOf(label)]):0),0);
      const supplement=cash(sumLoad('Total load pay')-sumLoad('Base / reject pay')-sumLoad('Wait pay'));
      const other=cash(val('Reject pay')+val('Wait pay')+val('Sleeper')+val('Trainer')+val('Vacation pay'));
      const calc=cash(x.completedPay+supplement+val('Per diem')+val('Other hourly pay')+other);
      const goal=d.fairGoal,stretch=d.excellentGoal;
      sh.getCell('A'+r).value=x.date;sh.getCell('A'+r).numFmt='@';
      cellFormula(sh,'B'+r,`'Daily Source'!C${r}`,x.completedLoads,'0');
      cellFormula(sh,'C'+r,`'Daily Source'!I${r}`,x.completedPay,CURRENCY);
      const dateMatch=`'Load Source'!$A$6:$A$${Math.max(6,loadLast)}`;
      // Convert the ISO string to a real Excel date for matching numeric source dates.
      const dateExpr=`DATE(VALUE(LEFT(A${r},4)),VALUE(MID(A${r},6,2)),VALUE(RIGHT(A${r},2)))`;
      const sumCol=col=>`SUMIF(${dateMatch},${dateExpr},'Load Source'!$${col}$6:$${col}$${Math.max(6,loadLast)})`;
      cellFormula(sh,'D'+r,`ROUND(${sumCol('AA')}-${sumCol('Y')}-${sumCol('Z')},2)`,supplement,CURRENCY);
      cellFormula(sh,'E'+r,`'Daily Source'!L${r}`,val('Per diem'),CURRENCY);
      cellFormula(sh,'F'+r,`'Daily Source'!O${r}`,val('Other hourly pay'),CURRENCY);
      cellFormula(sh,'G'+r,`SUM('Daily Source'!J${r}:K${r},'Daily Source'!M${r}:N${r},'Daily Source'!P${r})`,other,CURRENCY);
      cellFormula(sh,'H'+r,`SUM(C${r}:G${r})`,calc,CURRENCY);
      cellFormula(sh,'I'+r,`'Daily Source'!Q${r}`,x.totalEarnings,CURRENCY);
      cellFormula(sh,'J'+r,`ROUND(H${r}-I${r},2)`,cash(calc-x.totalEarnings),CURRENCY);
      cellFormula(sh,'K'+r,`'Daily Source'!T${r}`,x.dutyHours,NUMBER);
      cellFormula(sh,'L'+r,`IFERROR(H${r}/K${r},0)`,x.dutyHours>0?cash(calc/x.dutyHours):0,CURRENCY);
      cellFormula(sh,'M'+r,'Settings!$B$6',goal,CURRENCY);
      cellFormula(sh,'N'+r,'Settings!$B$7',stretch,CURRENCY);
      cellFormula(sh,'O'+r,`C${r}-M${r}`,cash(x.completedPay-goal),CURRENCY);
      cellFormula(sh,'P'+r,`IF(B${r}=0,"N/A",IF(C${r}>=M${r},"MET","BELOW"))`,x.completedLoads?x.completedPay>=goal?'MET':'BELOW':'N/A');
      cellFormula(sh,'Q'+r,`IF(B${r}=0,"N/A",IF(C${r}>=N${r},"MET","BELOW"))`,x.completedLoads?x.completedPay>=stretch?'MET':'BELOW':'N/A');
      cellFormula(sh,'R'+r,`IF(K${r}>=Settings!$B$8,"REVIEW","")`,x.dutyHours>=14?'REVIEW':'');
      if(i%2){sh.getRow(r).eachCell({includeEmpty:true},c=>{if(!c.fill)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF3F7FA'}};});}
      summaries.push({date:x.date,base:x.completedPay,supplement,other,calculated:calc,tracked:x.totalEarnings,duty:x.dutyHours||0,perDiem:val('Per diem'),hourly:val('Other hourly pay'),loads:x.completedLoads});
    }
    sh.getColumn(1).width=16;sh.getColumn(4).width=24;sh.getColumn(8).width=22;sh.getColumn(10).width=22;sh.getColumn(18).width=19;
    sh.autoFilter={from:{row:5,column:1},to:{row:Math.max(6,dailyLast),column:18}};
    if(n){sh.addConditionalFormatting({ref:`J6:J${dailyLast}`,rules:[{type:'cellIs',operator:'notEqual',formulae:['0'],style:{fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFFFD8D8'}}}}]});}
    return {sh,summaries};
  }
  function addMix(wb,summaries) {
    const sh=basicSheet(wb,'Earnings Mix','Earnings Composition','Category totals and shares recalculate from Daily Performance formulas.',['Earnings category','Total earnings','Share','Explanation']);
    const labels=['Base completed-load pay','Supplemental load pay','Per diem','Other hourly pay','Other pay types'];
    const cols=['C','D','E','F','G'];
    const n=summaries.length,last=n+5;
    labels.forEach((label,i)=>{
      const r=i+6;
      sh.getCell('A'+r).value=label;
      const val=cash(summaries.reduce((t,v)=>t+[v.base,v.supplement,v.perDiem,v.hourly,v.other][i],0));
      cellFormula(sh,'B'+r,`SUM('Daily Performance'!${cols[i]}6:${cols[i]}${last})`,val,CURRENCY);
      cellFormula(sh,'C'+r,`IFERROR(B${r}/$B$11,0)`,0,'0.0%');
      sh.getCell('D'+r).value=['Base pay for completed dispatch loads','Additional load-level compensation','Recorded per diem allowance','Recorded hourly pay','Reject, wait, sleeper, trainer and vacation pay'][i];
    });
    sh.getCell('A11').value='Total estimated earnings';cellFormula(sh,'B11','SUM(B6:B10)',cash(summaries.reduce((t,v)=>t+v.calculated,0)),CURRENCY);
    labels.forEach((_,i)=>sh.getCell('C'+(i+6)).value={formula:`IFERROR(B${i+6}/$B$11,0)`,result:0});
    sh.getCell('C11').value={formula:'SUM(C6:C10)',result:1};sh.getCell('C11').numFmt='0.0%';
    sh.getCell('A13').value='Tracker total';cellFormula(sh,'B13',`SUM('Daily Performance'!I6:I${last})`,cash(summaries.reduce((t,v)=>t+v.tracked,0)),CURRENCY);
    sh.getCell('A14').value='Reconciliation difference';cellFormula(sh,'B14','ROUND(B11-B13,2)',cash(summaries.reduce((t,v)=>t+v.calculated-v.tracked,0)),CURRENCY);
    sh.getColumn(1).width=36;sh.getColumn(2).width=22;sh.getColumn(3).width=14;sh.getColumn(4).width=65;
    return sh;
  }
  function addChartSheet(wb,d) {
    const sh=basicSheet(wb,'Interactive Charts','Editable Excel Charts',`Charts reference workbook cells, not static screenshots · ${d.range.start} through ${d.range.end}`,['Pay vs goals','Daily earnings','Duty hours','Earnings composition']);
    sh.getColumn(1).width=23;for(let i=2;i<=16;i++)sh.getColumn(i).width=12;
    sh.getCell('A7').value='1. Base pay against Fair and Stretch goals';
    sh.getCell('A26').value='2. Daily estimated earnings and base pay';
    sh.getCell('A45').value='3. Recorded duty hours';
    sh.getCell('A64').value='4. Earnings composition';
    sh.getCell('A82').value='Charts update when their supporting Excel formulas recalculate. Use Daily Performance and Settings to explore assumptions.';
    return sh;
  }
  function addMethod(wb,d) {
    const sh=wb.getWorksheet('How to Analyze');
    if(sh){sh.getCell('A22').value='Enhanced reporting';sh.getCell('B22').value='Daily Performance, Earnings Mix, Settings and Interactive Charts are formula-based. Personal earnings are not company profit.';}
    wb.calcProperties.fullCalcOnLoad=true;wb.calcProperties.forceFullCalc=true;wb.calcProperties.calcMode='auto';
  }
  function utf8(s) {return new TextEncoder().encode(s);}
  function zipEntries(data) {
    const u=data instanceof Uint8Array?data:new Uint8Array(data);
    const view=new DataView(u.buffer,u.byteOffset,u.byteLength),dec=new TextDecoder();
    const entries=new Map();let p=0;
    while(p+30<u.length&&view.getUint32(p,true)===0x04034b50){
      const flag=view.getUint16(p+6,true),method=view.getUint16(p+8,true),len=view.getUint32(p+18,true),namelen=view.getUint16(p+26,true),extra=view.getUint16(p+28,true);
      if(flag&8||method!==0)throw new Error('Native chart writer needs uncompressed Excel output.');
      const name=dec.decode(u.subarray(p+30,p+30+namelen));
      const start=p+30+namelen+extra;
      entries.set(name,u.slice(start,start+len));
      p=start+len;
    }
    if(!entries.size)throw new Error('Excel workbook could not be prepared for editable charts.');
    return entries;
  }
  const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
  function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
  function packZip(entries) {
    const parts=[], central=[];let offset=0;
    const header=(len)=>new Uint8Array(len);
    const view=u=>new DataView(u.buffer,u.byteOffset,u.byteLength);
    const push=(bytes)=>{parts.push(bytes);offset+=bytes.byteLength;};
    for(const [name,contents] of entries){
      const n=utf8(name),data=contents instanceof Uint8Array?contents:utf8(contents),crc=crc32(data),at=offset;
      const lh=header(30);const v=view(lh);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(8,0,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,n.length,true);
      push(lh);push(n);push(data);
      const ch=header(46);const cv=view(ch);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,n.length,true);cv.setUint32(42,at,true);central.push(ch,n);
    }
    const centralOffset=offset;central.forEach(push);const centralLength=offset-centralOffset;
    const end=header(22);const ev=view(end);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.size,true);ev.setUint16(10,entries.size,true);ev.setUint32(12,centralLength,true);ev.setUint32(16,centralOffset,true);push(end);
    const out=new Uint8Array(offset);let p=0;for(const part of parts){out.set(part,p);p+=part.length;}return out;
  }
  function chartXml(title,kind,series,maxrow,names) {
    const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const cat=`'Daily Performance'!$A$6:$A$${maxrow}`;
    const cols=series.map((s,i)=>{
      const valueRef=`'${s.sheet||'Daily Performance'}'!$${s.col}$${s.first||6}:$${s.col}$${s.last||maxrow}`;
      const categoryRef=s.sheet==='Earnings Mix'?`'Earnings Mix'!$A$6:$A$10`:cat;
      const catNodes=(s.labels||names).map((x,k)=>`<c:pt idx="${k}"><c:v>${escape(x)}</c:v></c:pt>`).join('');
      const cache=(s.values||[]).map((n,k)=>`<c:pt idx="${k}"><c:v>${Number(n)||0}</c:v></c:pt>`).join('');
      return `<c:ser><c:idx val="${i}"/><c:order val="${i}"/><c:tx><c:v>${escape(s.name)}</c:v></c:tx><c:spPr><a:solidFill><a:srgbClr val="${s.color||PALETTE.teal}"/></a:solidFill></c:spPr>${kind==='line'?'<c:marker><c:symbol val="none"/></c:marker>':''}<c:cat><c:strRef><c:f>${escape(categoryRef)}</c:f><c:strCache><c:ptCount val="${(s.labels||names).length}"/>${catNodes}</c:strCache></c:strRef></c:cat><c:val><c:numRef><c:f>${escape(valueRef)}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${(s.values||[]).length}"/>${cache}</c:numCache></c:numRef></c:val></c:ser>`;
    }).join('');
    const axids=[20000+Math.floor(Math.random()*100000),500000+Math.floor(Math.random()*100000)];
    const a=String(axids[0]),b=String(axids[1]);
    const cart=kind==='line'
      ?`<c:lineChart><c:grouping val="standard"/>${cols}<c:axId val="${a}"/><c:axId val="${b}"/></c:lineChart>`
      :kind==='pie'
        ?`<c:doughnutChart><c:varyColors val="1"/>${cols}<c:holeSize val="52"/></c:doughnutChart>`
        :`<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/>${cols}<c:axId val="${a}"/><c:axId val="${b}"/></c:barChart>`;
    const axes=kind==='pie'?'':`<c:catAx><c:axId val="${a}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="b"/><c:tickLblPos val="nextTo"/><c:crossAx val="${b}"/><c:crosses val="autoZero"/></c:catAx><c:valAx><c:axId val="${b}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="l"/><c:majorGridlines/><c:tickLblPos val="nextTo"/><c:crossAx val="${a}"/><c:crosses val="autoZero"/></c:valAx>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:lang val="en-US"/><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1300" b="1"/><a:t>${escape(title)}</a:t></a:r></a:p></c:rich></c:tx></c:title><c:plotArea><c:layout/>${cart}${axes}</c:plotArea><c:legend><c:legendPos val="b"/></c:legend><c:plotVisOnly val="1"/></c:chart></c:chartSpace>`;
  }
  function injectNativeCharts(buffer,workbook,d,summaries) {
    const entries=zipEntries(buffer);
    const decoder=new TextDecoder();
    const sheet=workbook.getWorksheet('Interactive Charts');
    const sheetPath=`xl/worksheets/sheet${sheet.id}.xml`;
    const old=decoder.decode(entries.get(sheetPath));
    const relPath=`xl/worksheets/_rels/sheet${sheet.id}.xml.rels`;
    if(!old)throw new Error('Interactive chart worksheet is missing.');
    if(entries.has(relPath))throw new Error('Chart worksheet has unexpected existing relationships.');
    let updated=old.replace(/<worksheet\b([^>]*)>/, (m,attrs)=>`<worksheet${attrs.includes('xmlns:r=')?'':' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'}${attrs}>`);
    updated=updated.replace('</worksheet>','<drawing r:id="rId1"/></worksheet>');
    entries.set(sheetPath,utf8(updated));
    entries.set(relPath,utf8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing2.xml"/></Relationships>'));
    const dailyRows=summaries.length,end=Math.max(6,5+dailyRows);
    const names=summaries.map(r=>r.date.slice(5));
    const mix=[['Base load pay','C','base'],['Supplemental','D','supplement'],['Per diem','E','perDiem'],['Hourly','F','hourly'],['Other','G','other']];
    const mixes=mix.map((x)=>cash(summaries.reduce((t,v)=>t+asNumber(v[x[2]]),0)));
    const charts=[
      chartXml('Daily base load pay vs goals','line',[
        {name:'Base load pay',col:'C',color:PALETTE.navy,values:summaries.map(v=>v.base)},
        {name:'Fair goal',col:'M',color:PALETTE.gold,values:summaries.map(()=>d.fairGoal)},
        {name:'Stretch goal',col:'N',color:PALETTE.green,values:summaries.map(()=>d.excellentGoal)}
      ],end,names),
      chartXml('Estimated earnings vs base pay','bar',[
        {name:'Total earnings',col:'H',color:PALETTE.teal,values:summaries.map(v=>v.calculated)},
        {name:'Base load pay',col:'C',color:PALETTE.gold,values:summaries.map(v=>v.base)}
      ],end,names),
      chartXml('Duty hours per recorded workday','line',[
        {name:'Duty hours',col:'K',color:PALETTE.red,values:summaries.map(v=>v.duty)}
      ],end,names),
      chartXml('Breakdown of estimated earnings','pie',[
        {name:'Earnings mix',sheet:'Earnings Mix',col:'B',first:6,last:10,color:PALETTE.teal,values:mixes,labels:mix.map(x=>x[0])}
      ],end,names)
    ];
    const anchors=charts.map((_,i)=>{
      const first=i*19+7, last=first+17;
      const marker=(col,row)=>`<xdr:col>${col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff>`;
      return `<xdr:twoCellAnchor><xdr:from>${marker(0,first)}</xdr:from><xdr:to>${marker(15,last)}</xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${i+2}" name="Editable Chart ${i+1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId${i+1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`;
    }).join('');
    entries.set('xl/drawings/drawing2.xml',utf8(`<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${anchors}</xdr:wsDr>`));
    entries.set('xl/drawings/_rels/drawing2.xml.rels',utf8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${charts.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="charts/chart${i+1}.xml"/>`).join('')}</Relationships>`));
    charts.forEach((x,i)=>entries.set(`xl/drawings/charts/chart${i+1}.xml`,utf8(x)));
    const contentPath='[Content_Types].xml';
    let content=decoder.decode(entries.get(contentPath));
    const addition=`<Override PartName="/xl/drawings/drawing2.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>${charts.map((_,i)=>`<Override PartName="/xl/drawings/charts/chart${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`).join('')}`;
    content=content.replace('</Types>',addition+'</Types>');
    entries.set(contentPath,utf8(content));
    return packZip(entries);
  }
  function download(name,bytes) {
    const b=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(b),link=root.document.createElement('a');
    link.href=url;link.download=name;root.document.body.appendChild(link);link.click();link.remove();root.setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  async function exportEnhanced() {
    const button=root.document.getElementById('download-complete-workbook-button');
    const status=root.document.getElementById('complete-workbook-status');
    if(button)button.disabled=true;
    if(status){status.textContent='Generating your formula-driven report and editable Excel charts...';status.dataset.error='false';}
    try {
      const data=getData();
      const wb=base.createWorkbook(data);
      addSettings(wb,data);
      const result=addPerformance(wb,data);
      addMix(wb,result.summaries);
      addChartSheet(wb,data);
      addMethod(wb,data);
      const plain=await wb.xlsx.writeBuffer({zip:{compression:'STORE'}});
      // Keep an ordinary Excel download available even if a browser cannot build native chart parts.
      let finalData=plain,nativeCharts=false;
      try{finalData=injectNativeCharts(plain,wb,data,result.summaries);nativeCharts=true;}catch(err){console.warn('Editable chart packaging unavailable; using illustrated dashboard.',err);}
      const name=`oilfield-enhanced-earnings-${data.range.start}-to-${data.range.end}.xlsx`;
      download(name,finalData);
      if(status)status.textContent=`Downloaded ${name} (${data.dailyRows.length} workdays, ${data.timingRows.length} loads; ${nativeCharts?'4 editable Excel charts':'visual dashboard and formula sheets'}).`;
    }catch(err){if(status){status.textContent='Report error: '+(err?.message||String(err));status.dataset.error='true';}console.error('Enhanced Excel export failed',err);}
    finally{if(button)button.disabled=false;}
  }
  const button=root.document.getElementById('download-complete-workbook-button');
  if(button) {
    const replacement=button.cloneNode(true);
    replacement.dataset.completeWorkbookWired='true';
    replacement.addEventListener('click',exportEnhanced);
    button.replaceWith(replacement);
  }
  root.LoadTrackerEnhancedWorkbook={exportEnhanced,zipEntries,packZip,injectNativeCharts};
})(typeof globalThis !== 'undefined' ? globalThis : window);
