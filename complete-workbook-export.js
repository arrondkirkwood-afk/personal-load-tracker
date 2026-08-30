(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LoadTrackerCompleteWorkbook = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const COLORS = {
    navy: '17324D', teal: '137C8B', darkTeal: '12343B', paleTeal: 'E8F3F4',
    paleBlue: 'EDF3F8', gold: 'D6A84B', paleGold: 'FFF7E4', red: 'C53030',
    paleRed: 'FFF1F1', green: '2F855A', paleGreen: 'EDF8F1', white: 'FFFFFF',
    ink: '23313D', muted: '5F6F7B', border: 'CFD9E2'
  };
  const DAILY_SHEET = 'Daily Analysis';
  const TIMING_SHEET = 'Load Timing';
  const DAILY_DATA_SHEET = 'Daily Source';
  const LOAD_DATA_SHEET = 'Load Source';
  const GUIDE_SHEET = 'How to Analyze';

  function excelLibrary() {
    if (!root?.ExcelJS?.Workbook) throw new Error('Excel workbook support is unavailable. Refresh the app and try again.');
    return root.ExcelJS;
  }

  function safeText(value) {
    const text = value == null ? '' : String(value);
    return /^[=+\-@]/.test(text) ? `'${text}` : text;
  }

  function localDateStamp() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  function parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  }

  function formatDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function excelDate(value) {
    const date = parseDate(value);
    return date || safeText(value);
  }

  function daysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function payPeriod(dateValue) {
    const date = parseDate(dateValue) || new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() <= 15 ? 1 : 16, 12);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() <= 15 ? 15 : daysInMonth(date), 12);
    return { start: formatDate(start), end: formatDate(end) };
  }

  function previousPayPeriod(dateValue) {
    const current = payPeriod(dateValue);
    const previousDate = parseDate(current.start);
    previousDate.setDate(previousDate.getDate() - 1);
    return payPeriod(formatDate(previousDate));
  }

  function monthRange(dateValue, offset = 0) {
    const date = parseDate(dateValue) || new Date();
    const first = new Date(date.getFullYear(), date.getMonth() + offset, 1, 12);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12);
    return { start: formatDate(first), end: formatDate(last) };
  }

  function indexOf(headers, label) {
    return headers.indexOf(label);
  }

  function valueAt(row, headers, label) {
    const index = indexOf(headers, label);
    return index >= 0 ? row[index] : '';
  }

  function numberAt(row, headers, label) {
    const value = Number(valueAt(row, headers, label));
    return Number.isFinite(value) ? value : 0;
  }

  function timeMinutes(value) {
    const match = /^(\d{1,2}):(\d{2})/.exec(String(value || ''));
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  function durationMinutes(start, end) {
    const from = timeMinutes(start);
    const to = timeMinutes(end);
    if (from == null || to == null) return null;
    return to >= from ? to - from : to + 1440 - from;
  }

  function allSavedDates(loadExport, dailyExport) {
    return [...loadExport.rows, ...dailyExport.rows].map((row) => String(row[0] || '')).filter(Boolean).sort();
  }

  function getSelectedDate() {
    return root.document?.getElementById?.('daily-date')?.value || formatDate(new Date());
  }

  function determineRange(mode, startValue, endValue, loadExport, dailyExport) {
    const selected = getSelectedDate();
    if (mode === 'selected-date') return { start: selected, end: selected };
    if (mode === 'current-pay-period') return payPeriod(selected);
    if (mode === 'previous-pay-period') return previousPayPeriod(selected);
    if (mode === 'current-month') return monthRange(selected);
    if (mode === 'previous-month') return monthRange(selected, -1);
    if (mode === 'overall') {
      const dates = allSavedDates(loadExport, dailyExport);
      return { start: dates[0] || selected, end: dates.at(-1) || selected };
    }
    return { start: startValue || selected, end: endValue || startValue || selected };
  }

  function filterExport(result, range) {
    return { ...result, rows: result.rows.filter((row) => String(row[0] || '') >= range.start && String(row[0] || '') <= range.end) };
  }

  function getGoal(snapshot, name, fallback) {
    const settings = snapshot?.data?.settings || {};
    const value = Number(settings[name]);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  function createDataset(snapshot, range) {
    const cleanup = root.LoadTrackerExportCleanup;
    if (!cleanup) throw new Error('The clean export engine is unavailable. Refresh the app and try again.');
    const loads = filterExport(cleanup.buildCleanLoadExport(snapshot), range);
    const daily = filterExport(cleanup.buildCleanDailyEarningsExport(snapshot), range);
    const fairGoal = getGoal(snapshot, 'fairDayGoal', 280);
    const excellentGoal = getGoal(snapshot, 'excellentDayGoal', getGoal(snapshot, 'dailyCompletedLoadPayGoal', 300));
    const dailyRows = daily.rows.map((row) => {
      const completedLoads = numberAt(row, daily.headers, 'Completed loads');
      const completedPay = numberAt(row, daily.headers, 'Completed-load pay');
      const totalEarnings = numberAt(row, daily.headers, 'Total estimated earnings');
      const dutyHoursRaw = valueAt(row, daily.headers, 'Duty hours');
      const dutyHours = dutyHoursRaw === '' ? null : Number(dutyHoursRaw);
      const eligible = completedLoads > 0 || numberAt(row, daily.headers, 'Rejects') > 0;
      const goalVariance = eligible ? completedPay - fairGoal : null;
      return {
        date: String(valueAt(row, daily.headers, 'Date') || ''),
        payPeriod: String(valueAt(row, daily.headers, 'Pay period') || ''),
        completedLoads,
        rejects: numberAt(row, daily.headers, 'Rejects'),
        grossBarrels: numberAt(row, daily.headers, 'Gross barrels'),
        loadedMiles: numberAt(row, daily.headers, 'Loaded miles'),
        completedPay,
        totalEarnings,
        dutyHours: Number.isFinite(dutyHours) ? dutyHours : null,
        effectiveHourly: numberAt(row, daily.headers, 'Effective hourly earnings') || null,
        fairGoal,
        excellentGoal,
        eligible,
        goalVariance,
        goalStatus: !eligible ? 'Not applicable' : (completedPay >= fairGoal ? 'Goal met' : 'Below goal'),
        fourteenHourReview: Number.isFinite(dutyHours) && dutyHours >= 14,
        longBelowGoal: Number.isFinite(dutyHours) && dutyHours >= 14 && eligible && completedPay < fairGoal,
        completedPayPerHour: Number.isFinite(dutyHours) && dutyHours > 0 ? completedPay / dutyHours : null,
        dispatcher: String(valueAt(row, daily.headers, 'Default dispatcher') || 'Unknown'),
        notes: String(valueAt(row, daily.headers, 'Notes') || '')
      };
    });
    const timingRows = loads.rows.map((row) => {
      const loadingStart = valueAt(row, loads.headers, 'Loading start');
      const loadingEnd = valueAt(row, loads.headers, 'Loading end');
      const unloadStart = valueAt(row, loads.headers, 'Unload start');
      const unloadEnd = valueAt(row, loads.headers, 'Unload end');
      const cycle = durationMinutes(loadingStart, unloadEnd);
      const totalPay = numberAt(row, loads.headers, 'Total load pay');
      return {
        date: String(valueAt(row, loads.headers, 'Date') || ''), loadNumber: String(valueAt(row, loads.headers, 'Load #') || ''),
        pickup: String(valueAt(row, loads.headers, 'Pickup') || ''), dropoff: String(valueAt(row, loads.headers, 'Drop-off') || ''),
        grossBarrels: numberAt(row, loads.headers, 'Gross barrels'), loadedMiles: numberAt(row, loads.headers, 'Loaded miles'),
        loadingStart, loadingEnd, unloadStart, unloadEnd,
        loadingMinutes: durationMinutes(loadingStart, loadingEnd), travelMinutes: durationMinutes(loadingEnd, unloadStart),
        unloadingMinutes: durationMinutes(unloadStart, unloadEnd), cycleMinutes: cycle, totalPay,
        cyclePayPerHour: Number.isFinite(cycle) && cycle > 0 ? totalPay / (cycle / 60) : null,
        dispatcher: String(valueAt(row, loads.headers, 'Dispatcher') || 'Unknown')
      };
    });
    return { range, loads, daily, dailyRows, timingRows, fairGoal, excellentGoal };
  }

  function styleTitle(sheet, title, subtitle, lastColumn = 'L') {
    sheet.mergeCells(`A1:${lastColumn}1`);
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { name: 'Aptos Display', size: 20, bold: true, color: { argb: COLORS.white } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkTeal } };
    sheet.getCell('A1').alignment = { vertical: 'middle' };
    sheet.getRow(1).height = 38;
    sheet.mergeCells(`A2:${lastColumn}2`);
    sheet.getCell('A2').value = subtitle;
    sheet.getCell('A2').font = { name: 'Aptos', size: 10, color: { argb: COLORS.muted } };
    sheet.getCell('A2').alignment = { vertical: 'middle', wrapText: true };
    sheet.getRow(2).height = 30;
  }

  function formatCell(cell, type) {
    const formats = { currency: '$#,##0.00;[Red]-$#,##0.00', number: '#,##0.00', integer: '#,##0', percent: '0.0%', hours: '0.00', date: 'yyyy-mm-dd' };
    if (formats[type]) cell.numFmt = formats[type];
  }

  function makeChartDataUrl(title, rows, valueKey, target, formatter, dangerTest) {
    const documentObject = root.document;
    if (!documentObject?.createElement || !rows.length) return '';
    const canvas = documentObject.createElement('canvas');
    if (!canvas?.getContext) return '';
    canvas.width = 1000;
    canvas.height = Math.max(330, Math.min(640, 115 + rows.length * 34));
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const left = 110, right = 110, top = 68, bottom = 38;
    const width = canvas.width - left - right;
    const chartRows = rows.slice(-14);
    const max = Math.max(target || 0, ...chartRows.map((row) => Number(row[valueKey]) || 0), 1) * 1.08;
    const rowHeight = (canvas.height - top - bottom) / chartRows.length;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#17324d'; ctx.font = 'bold 25px Arial'; ctx.fillText(title, 30, 38);
    const targetX = left + width * (target / max);
    ctx.strokeStyle = '#7b4f00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(targetX, top - 8); ctx.lineTo(targetX, canvas.height - bottom + 5); ctx.stroke();
    ctx.font = '14px Arial'; ctx.fillStyle = '#7b4f00'; ctx.fillText(`Review marker ${formatter(target)}`, Math.min(targetX + 7, canvas.width - 230), 61);
    chartRows.forEach((row, index) => {
      const value = Number(row[valueKey]) || 0;
      const y = top + index * rowHeight + 5;
      ctx.fillStyle = '#e4ecee'; ctx.fillRect(left, y, width, Math.max(13, rowHeight - 10));
      ctx.fillStyle = dangerTest(row) ? '#c53030' : (value >= target ? '#2f855a' : '#d6a84b');
      ctx.fillRect(left, y, width * (value / max), Math.max(13, rowHeight - 10));
      ctx.fillStyle = '#5f6f7b'; ctx.font = '14px Arial'; ctx.fillText(row.date.slice(5).replace('-', '/'), 35, y + rowHeight - 13);
      ctx.fillStyle = '#17324d'; ctx.font = 'bold 14px Arial'; ctx.fillText(formatter(value), left + width + 12, y + rowHeight - 13);
    });
    return canvas.toDataURL('image/png');
  }

  function addDashboard(workbook, data) {
    const sheet = workbook.addWorksheet('Dashboard', { views: [{ showGridLines: false }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1 } });
    styleTitle(sheet, 'Load Tracker Performance Dashboard', `${data.range.start} through ${data.range.end} · Created from saved tracker records`, 'N');
    const eligible = data.dailyRows.filter((row) => row.eligible);
    const exact = eligible.filter((row) => Number.isFinite(row.dutyHours));
    const totalCompletedPay = eligible.reduce((total, row) => total + row.completedPay, 0);
    const totalGoal = eligible.length * data.fairGoal;
    const totalEarnings = data.dailyRows.reduce((total, row) => total + row.totalEarnings, 0);
    const totalHours = exact.reduce((total, row) => total + row.dutyHours, 0);
    const metrics = [
      ['Dispatched days', eligible.length, 'integer'], ['Completed loads', eligible.reduce((total, row) => total + row.completedLoads, 0), 'integer'],
      ['Total estimated earnings', totalEarnings, 'currency'], ['Fair Goal variance', totalCompletedPay - totalGoal, 'currency'],
      ['Days below Fair Goal', eligible.filter((row) => row.goalStatus === 'Below goal').length, 'integer'],
      ['14-hour review days', exact.filter((row) => row.fourteenHourReview).length, 'integer'],
      ['Long + below goal', exact.filter((row) => row.longBelowGoal).length, 'integer'],
      ['Completed pay / exact hour', totalHours > 0 ? exact.reduce((total, row) => total + row.completedPay, 0) / totalHours : null, 'currency']
    ];
    metrics.forEach(([label, value, type], index) => {
      const column = index % 4 * 3 + 1;
      const row = 4 + Math.floor(index / 4) * 3;
      sheet.mergeCells(row, column, row, column + 1);
      sheet.getCell(row, column).value = label;
      sheet.getCell(row, column).font = { name: 'Aptos', bold: true, color: { argb: COLORS.muted } };
      sheet.mergeCells(row + 1, column, row + 1, column + 1);
      const valueCell = sheet.getCell(row + 1, column);
      valueCell.value = value;
      valueCell.font = { name: 'Aptos Display', size: 18, bold: true, color: { argb: COLORS.darkTeal } };
      valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: (label.includes('Long') && value > 0) ? COLORS.paleRed : (label.includes('variance') && value < 0 ? COLORS.paleGold : COLORS.paleTeal) } };
      formatCell(valueCell, type);
    });
    const payChart = makeChartDataUrl('Completed-load pay versus Fair Goal', eligible, 'completedPay', data.fairGoal, (value) => `$${value.toFixed(0)}`, () => false);
    const hourChart = makeChartDataUrl('Exact workday hours versus 14-hour review', exact, 'dutyHours', 14, (value) => `${value.toFixed(1)}h`, (row) => row.dutyHours >= 14);
    if (payChart) {
      const imageId = workbook.addImage({ base64: payChart, extension: 'png' });
      sheet.addImage(imageId, { tl: { col: 0, row: 10 }, ext: { width: 600, height: 330 } });
    }
    if (hourChart) {
      const imageId = workbook.addImage({ base64: hourChart, extension: 'png' });
      sheet.addImage(imageId, { tl: { col: 7, row: 10 }, ext: { width: 600, height: 330 } });
    }
    if (!payChart || !hourChart) {
      sheet.mergeCells('A11:N13');
      sheet.getCell('A11').value = 'Charts could not be drawn on this device. The complete supporting tables remain available on the Daily Analysis and Load Timing sheets.';
      sheet.getCell('A11').alignment = { wrapText: true, vertical: 'middle' };
    }
    for (let column = 1; column <= 14; column += 1) sheet.getColumn(column).width = 12;
    sheet.headerFooter.oddFooter = '&LPersonal Oilfield Load Tracker&CPage &P of &N&RComplete Report';
    return sheet;
  }

  function addDailyAnalysis(workbook, data) {
    const sheet = workbook.addWorksheet(DAILY_SHEET, { views: [{ state: 'frozen', ySplit: 5, xSplit: 1, showGridLines: false }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    const headers = ['Date','Pay period','Completed loads','Rejects','Gross barrels','Loaded miles','Completed-load pay','Total earnings','Duty hours','Fair Goal','Goal variance','Goal status','14-hour review','Long + below goal','Completed pay/hour','Dispatcher','Notes'];
    styleTitle(sheet, 'Daily Earnings and Workday Analysis', 'One row per workday. Yellow indicates a missed Fair Goal; red indicates a 14-hour review.', 'Q');
    const rows = data.dailyRows.map((row) => [excelDate(row.date),safeText(row.payPeriod),row.completedLoads,row.rejects,row.grossBarrels,row.loadedMiles,row.completedPay,row.totalEarnings,row.dutyHours,row.fairGoal,row.goalVariance,safeText(row.goalStatus),row.fourteenHourReview ? 'REVIEW' : '',row.longBelowGoal ? 'YES' : '',row.completedPayPerHour,safeText(row.dispatcher),safeText(row.notes)]);
    sheet.addTable({ name: 'DailyAnalysisTable', ref: 'A5', headerRow: true, totalsRow: false, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: headers.map((name) => ({ name })), rows: rows.length ? rows : [headers.map(() => null)] });
    const finalRow = Math.max(6, rows.length + 5);
    [1].forEach((column) => { for (let row = 6; row <= finalRow; row += 1) formatCell(sheet.getCell(row,column),'date'); });
    [7,8,10,11,15].forEach((column) => { for (let row = 6; row <= finalRow; row += 1) formatCell(sheet.getCell(row,column),'currency'); });
    [5,6,9].forEach((column) => { for (let row = 6; row <= finalRow; row += 1) formatCell(sheet.getCell(row,column),'number'); });
    for (let row = 6; row <= finalRow; row += 1) {
      if (sheet.getCell(row,12).value === 'Below goal') sheet.getCell(row,12).fill = { type:'pattern',pattern:'solid',fgColor:{argb:COLORS.paleGold} };
      if (sheet.getCell(row,13).value === 'REVIEW' || sheet.getCell(row,14).value === 'YES') sheet.getRow(row).eachCell((cell) => { cell.fill = { type:'pattern',pattern:'solid',fgColor:{argb:COLORS.paleRed} }; });
    }
    headers.forEach((header,index) => { sheet.getColumn(index + 1).width = header === 'Notes' ? 38 : Math.min(23,Math.max(12,header.length + 2)); });
    return sheet;
  }

  function addLoadTiming(workbook, data) {
    const sheet = workbook.addWorksheet(TIMING_SHEET, { views: [{ state:'frozen',ySplit:5,xSplit:2,showGridLines:false }], pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0} });
    const headers = ['Date','Load #','Pickup','Drop-off','Gross barrels','Loaded miles','Loading start','Loading end','Unload start','Unload end','Loading minutes','Travel minutes','Unloading minutes','Cycle minutes','Total load pay','Cycle pay/hour','Dispatcher'];
    styleTitle(sheet, 'Load Timing Breakdown', 'Missing timestamps remain blank rather than being estimated.', 'Q');
    const rows = data.timingRows.map((row) => [excelDate(row.date),safeText(row.loadNumber),safeText(row.pickup),safeText(row.dropoff),row.grossBarrels,row.loadedMiles,safeText(row.loadingStart),safeText(row.loadingEnd),safeText(row.unloadStart),safeText(row.unloadEnd),row.loadingMinutes,row.travelMinutes,row.unloadingMinutes,row.cycleMinutes,row.totalPay,row.cyclePayPerHour,safeText(row.dispatcher)]);
    sheet.addTable({ name:'LoadTimingTable',ref:'A5',headerRow:true,totalsRow:false,style:{theme:'TableStyleMedium2',showRowStripes:true},columns:headers.map((name)=>({name})),rows:rows.length?rows:[headers.map(()=>null)] });
    const finalRow = Math.max(6,rows.length+5);
    for(let row=6;row<=finalRow;row+=1){formatCell(sheet.getCell(row,1),'date');[5,6,11,12,13,14].forEach((column)=>formatCell(sheet.getCell(row,column),'number'));[15,16].forEach((column)=>formatCell(sheet.getCell(row,column),'currency'));}
    headers.forEach((header,index)=>{sheet.getColumn(index+1).width=['Pickup','Drop-off'].includes(header)?24:Math.min(20,Math.max(12,header.length+2));});
    return sheet;
  }

  function addSourceSheet(workbook, name, result) {
    const sheet = workbook.addWorksheet(name, { views:[{state:'frozen',ySplit:5,xSplit:1,showGridLines:false}],pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0} });
    const lastColumn = columnLetters(result.headers.length);
    styleTitle(sheet, name, 'Clean source records supporting this workbook. Use filter arrows to inspect individual records.', lastColumn);
    const typed = result.rows.map((row)=>row.map((value,index)=>index===0?excelDate(value):(typeof value==='number'?value:safeText(value))));
    sheet.addTable({name:name==='Daily Source'?'DailySourceTable':'LoadSourceTable',ref:'A5',headerRow:true,totalsRow:false,style:{theme:'TableStyleMedium2',showRowStripes:true},columns:result.headers.map((header)=>({name:header})),rows:typed.length?typed:[result.headers.map(()=>null)]});
    result.headers.forEach((header,index)=>{sheet.getColumn(index+1).width=header==='Notes'?38:Math.min(24,Math.max(11,header.length+2));});
    for(let row=6;row<=Math.max(6,typed.length+5);row+=1) formatCell(sheet.getCell(row,1),'date');
    return sheet;
  }

  function columnLetters(number) {
    let value=number,result='';
    while(value>0){value-=1;result=String.fromCharCode(65+(value%26))+result;value=Math.floor(value/26);}
    return result;
  }

  function addGuide(workbook, data) {
    const sheet=workbook.addWorksheet(GUIDE_SHEET,{views:[{showGridLines:false}],pageSetup:{orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:1}});
    styleTitle(sheet,'How to Read and Preserve This Report',`${data.range.start} through ${data.range.end}`,'H');
    const sections=[
      ['1. Start with the Dashboard','Review Fair Goal variance, days below goal, 14-hour review days, and Long + below goal. These show the overall outcome; they do not prove why it occurred.'],
      ['2. Investigate the daily rows','On Daily Analysis, find yellow below-goal dates and red 14-hour review dates. A long day below goal is the strongest discrepancy to examine.'],
      ['3. Trace the load timing','Use Load Timing to determine whether loading, travel, unloading, waiting, or the total cycle consumed the workday. Blank time means the timestamp was not recorded.'],
      ['4. Verify the evidence','Confirm important dates against tickets, your pay stub, and the Load Source and Daily Source sheets. Missing information is not guessed.'],
      ['5. Preserve your copy','Use File → Save As and name the workbook with its pay-period dates. Do not overwrite an earlier period. Download a fresh report from the app for each new period.'],
      ['Important limitation','This personal report measures your recorded earnings and work outcomes. It does not calculate the company’s true profit because customer revenue, fuel, maintenance, insurance, and other company costs are not available.']
    ];
    sections.forEach(([title,body],index)=>{const row=4+index*3;sheet.mergeCells(`A${row}:H${row}`);sheet.getCell(`A${row}`).value=title;sheet.getCell(`A${row}`).font={name:'Aptos Display',size:13,bold:true,color:{argb:COLORS.darkTeal}};sheet.mergeCells(`A${row+1}:H${row+1}`);sheet.getCell(`A${row+1}`).value=body;sheet.getCell(`A${row+1}`).alignment={wrapText:true,vertical:'top'};sheet.getRow(row+1).height=42;sheet.getCell(`A${row+1}`).fill={type:'pattern',pattern:'solid',fgColor:{argb:index===sections.length-1?COLORS.paleGold:COLORS.paleTeal}};});
    for(let column=1;column<=8;column+=1)sheet.getColumn(column).width=14;
    return sheet;
  }

  function createWorkbook(dataset) {
    const ExcelJS=excelLibrary();
    const workbook=new ExcelJS.Workbook();
    const now=new Date();
    workbook.creator='Oilfield Load & Workday Tracker';workbook.lastModifiedBy='Oilfield Load & Workday Tracker';workbook.created=now;workbook.modified=now;
    workbook.calcProperties.fullCalcOnLoad=true;workbook.calcProperties.forceFullCalc=true;workbook.calcProperties.calcMode='auto';
    addDashboard(workbook,dataset);addDailyAnalysis(workbook,dataset);addLoadTiming(workbook,dataset);addSourceSheet(workbook,DAILY_DATA_SHEET,dataset.daily);addSourceSheet(workbook,LOAD_DATA_SHEET,dataset.loads);addGuide(workbook,dataset);
    return workbook;
  }

  function downloadBlob(filename,data){const blob=new Blob([data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),0);}

  function getControls(){return{mode:root.document?.getElementById?.('workbook-range-mode'),start:root.document?.getElementById?.('workbook-start-date'),end:root.document?.getElementById?.('workbook-end-date'),label:root.document?.getElementById?.('workbook-range-label'),days:root.document?.getElementById?.('workbook-day-count'),loads:root.document?.getElementById?.('workbook-load-count'),button:root.document?.getElementById?.('download-complete-workbook-button'),status:root.document?.getElementById?.('complete-workbook-status')};}

  function currentDataset(){const snapshot=root.getTrackerSnapshot?.();if(!snapshot)throw new Error('Tracker data is unavailable. Refresh the app and try again.');const cleanup=root.LoadTrackerExportCleanup;if(!cleanup)throw new Error('Export support is still loading. Close and reopen the app, then try again.');const allLoads=cleanup.buildCleanLoadExport(snapshot);const allDaily=cleanup.buildCleanDailyEarningsExport(snapshot);const controls=getControls();const range=determineRange(controls.mode?.value||'current-pay-period',controls.start?.value,controls.end?.value,allLoads,allDaily);if(range.end<range.start)throw new Error('The end date must be on or after the start date.');return createDataset(snapshot,range);}

  function syncUi(){const controls=getControls();if(!controls.mode)return;try{const dataset=currentDataset();if(controls.mode.value!=='custom'){controls.start.value=dataset.range.start;controls.end.value=dataset.range.end;}if(controls.start)controls.start.disabled=controls.mode.value!=='custom';if(controls.end)controls.end.disabled=controls.mode.value!=='custom';if(controls.label)controls.label.textContent=`${dataset.range.start} to ${dataset.range.end}`;if(controls.days)controls.days.textContent=String(dataset.dailyRows.length);if(controls.loads)controls.loads.textContent=String(dataset.timingRows.length);if(controls.status){controls.status.textContent='Ready to create the workbook.';controls.status.dataset.error='false';}}catch(error){if(controls.status){controls.status.textContent=error.message;controls.status.dataset.error='true';}}}

  async function downloadCompleteWorkbook(){const controls=getControls();controls.button.disabled=true;if(controls.status){controls.status.textContent='Building your workbook and charts...';controls.status.dataset.error='false';}try{const dataset=currentDataset();const workbook=createWorkbook(dataset);const buffer=await workbook.xlsx.writeBuffer();const filename=`arrond-complete-load-analysis-${dataset.range.start}-to-${dataset.range.end}.xlsx`;downloadBlob(filename,buffer);if(controls.status)controls.status.textContent=`Downloaded ${filename}`;return filename;}catch(error){if(controls.status){controls.status.textContent=error.message;controls.status.dataset.error='true';}throw error;}finally{controls.button.disabled=false;}}

  function wire(){const controls=getControls();if(!controls.button||controls.button.dataset.completeWorkbookWired==='true')return;controls.button.dataset.completeWorkbookWired='true';controls.mode?.addEventListener('change',syncUi);controls.start?.addEventListener('change',syncUi);controls.end?.addEventListener('change',syncUi);controls.button.addEventListener('click',()=>downloadCompleteWorkbook().catch(()=>{}));syncUi();}

  wire();
  return { createDataset, createWorkbook, determineRange, durationMinutes, filterExport, syncUi, downloadCompleteWorkbook };
}));
