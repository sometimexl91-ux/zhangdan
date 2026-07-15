/* ===== 借还记账 H5 版 - 主应用 ===== */

/* ---- Helpers ---- */
function navigate(hash){window.location.hash=hash;render()}
function qs(s){return document.querySelector(s)}
function qsa(s){return document.querySelectorAll(s)}
function esc(s){var d=document.createElement('div');d.appendChild(document.createTextNode(s||''));return d.innerHTML}

function showToast(msg,icon){
  var t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.75);color:#fff;padding:14rpx 28rpx;border-radius:8px;font-size:14px;z-index:9999;text-align:center;max-width:70%;pointer-events:none';document.body.appendChild(t)}
  t.textContent=msg;t.style.display='block';clearTimeout(t._t);t._t=setTimeout(function(){t.style.display='none'},1500)
}
function showModal(title,content,cb){
  var d=document.createElement('div');d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:10000;display:flex;align-items:center;justify-content:center'
  d.innerHTML='<div style="background:#fff;border-radius:12px;width:300px;max-width:85%;padding:24px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.15)"><div style="font-size:16px;font-weight:500;margin-bottom:8px">'+esc(title)+'</div><div style="font-size:14px;color:#666;margin-bottom:20px">'+esc(content)+'</div><div style="display:flex;gap:12px;justify-content:center"><button class="btn btn-cancel" style="flex:1">取消</button><button class="btn btn-confirm" style="flex:1">确定</button></div></div>'
  document.body.appendChild(d)
  d.querySelector('.btn-cancel').onclick=function(){d.remove();cb&&cb(false)}
  d.querySelector('.btn-confirm').onclick=function(){d.remove();cb&&cb(true)}
}
function showPrompt(title,placeholder,defaultValue,cb){
  var d=document.createElement('div');d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:10000;display:flex;align-items:center;justify-content:center'
  d.innerHTML='<div style="background:#fff;border-radius:12px;width:300px;max-width:85%;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.15)"><div style="font-size:16px;font-weight:500;margin-bottom:12px;text-align:center">'+esc(title)+'</div><input id="_promptInput" value="'+esc(defaultValue||'')+'" placeholder="'+esc(placeholder||'')+'" style="width:100%;border:1px solid #e0e0e0;border-radius:8px;padding:10px 12px;font-size:16px;outline:none;box-sizing:border-box;margin-bottom:16px" autofocus/><div style="display:flex;gap:12px"><button class="btn btn-cancel" style="flex:1" id="_promptCancel">取消</button><button class="btn btn-confirm" style="flex:1" id="_promptOk">确定</button></div></div>'
  document.body.appendChild(d)
  var inp=d.querySelector('#_promptInput')
  setTimeout(function(){if(inp){inp.focus();inp.select()}},300)
  d.querySelector('#_promptCancel').onclick=function(){d.remove();cb&&cb(null)}
  d.querySelector('#_promptOk').onclick=function(){d.remove();cb&&cb(inp?inp.value:null)}
  inp.onkeydown=function(e){if(e.key==='Enter'){d.remove();cb&&cb(inp?inp.value:null)}}
}

/* ---- Toast style inject ---- */
(function(){var s=document.createElement('style');s.textContent='.btn{padding:10px 0;border:none;border-radius:8px;font-size:14px;cursor:pointer}.btn-cancel{background:#f0f0f0;color:#333}.btn-confirm{background:#07c160;color:#fff}.btn-danger{background:#ee4d2d;color:#fff}.btn-blue{background:#07c160;color:#fff}';document.head.appendChild(s)})();

/* ---- Seed data (同小程序 seed.js 逻辑) ---- */
function shift(n){var d=new Date();d.setDate(d.getDate()+n);var p=function(x){return x<10?'0'+x:''+x};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
function r2(x){return Math.round(x*100)/100}
function repayFirst(loan,k){
  if(!k)return[];var plan=genPlan(loan,todayStr());var reps=[]
  for(var i=0;i<k&&i<plan.periods.length;i++){var p=plan.periods[i];reps.push({id:'seed_rep_'+loan.id+'_'+i,amount:r2(p.total),date:p.dueDate,method:'微信',note:'示例还款',planIndex:p.index,principalPortion:r2(p.principal),interestPortion:r2(p.interest)})}
  return reps
}
function seedDemoData(){
  var books=[{id:'seed_book_my',name:'我的账本',createdAt:Date.now()},{id:'seed_book_family',name:'家庭共用',createdAt:Date.now()},{id:'seed_book_wife',name:'老婆的小账本',createdAt:Date.now()}]
  var loans=[
    {id:'seed_a',bookId:'seed_book_my',direction:'lend',name:'赵六（前同事）',contact:'138****0000',principal:20000,currency:'¥',rate:10,interestType:'复利',planMethod:'lump',planFreq:'monthly',startDate:shift(-500),dueDate:shift(-35),note:'去年应急周转，说好今年初还',settled:false,createdAt:Date.now(),repayments:[]},
    {id:'seed_b',bookId:'seed_book_my',direction:'lend',name:'张三（朋友）',contact:'微信：zhangsan',principal:15000,currency:'¥',rate:0,interestType:'不计息',planMethod:'lump',planFreq:'monthly',startDate:shift(-50),dueDate:shift(6),note:'装修借的，下个月还',settled:false,createdAt:Date.now(),repayments:[{id:'seed_b_r1',amount:5000,date:shift(-10),method:'微信',note:'先还一部分'}]},
    {id:'seed_c',bookId:'seed_book_my',direction:'lend',name:'李四（生意伙伴）',contact:'188****8888',principal:50000,currency:'¥',rate:8,interestType:'单利',planMethod:'equalInstallment',planFreq:'monthly',startDate:shift(-65),dueDate:shift(300),note:'进货周转，按月分期还',settled:false,createdAt:Date.now(),repayments:[]},
    {id:'seed_d',bookId:'seed_book_family',direction:'loan',name:'王姐（亲戚）',contact:'158****1234',principal:120000,currency:'¥',rate:5,interestType:'单利',planMethod:'equalPrincipal',planFreq:'yearly',startDate:shift(-400),dueDate:shift(1460),note:'家里装修借的，按年还',settled:false,createdAt:Date.now(),repayments:[]},
    {id:'seed_e',bookId:'seed_book_family',direction:'lend',name:'表哥',contact:'',principal:8000,currency:'¥',rate:0,interestType:'不计息',planMethod:'lump',planFreq:'monthly',startDate:shift(-200),dueDate:shift(-15),note:'临时救急，已还清',settled:true,createdAt:Date.now(),repayments:[{id:'seed_e_r1',amount:8000,date:shift(-20),method:'转账',note:'结清',planIndex:0,principalPortion:8000,interestPortion:0}]},
    {id:'seed_f',bookId:'seed_book_wife',direction:'lend',name:'闺蜜小美',contact:'微信：xiaomei',principal:3000,currency:'¥',rate:0,interestType:'不计息',planMethod:'lump',planFreq:'monthly',startDate:shift(-100),dueDate:shift(25),note:'拼单垫付',settled:false,createdAt:Date.now(),repayments:[]},
    {id:'seed_g',bookId:'seed_book_my',direction:'income',name:'公司工资',contact:'',principal:15000,currency:'¥',rate:0,interestType:'不计息',planMethod:'lump',planFreq:'monthly',startDate:shift(5),dueDate:shift(5),note:'每月15号发薪',settled:false,createdAt:Date.now(),repayments:[],incomeType:'工资'},
    {id:'seed_h',bookId:'seed_book_family',direction:'income',name:'理财收益',contact:'',principal:2000,currency:'¥',rate:0,interestType:'不计息',planMethod:'lump',planFreq:'monthly',startDate:shift(20),dueDate:shift(20),note:'基金收益',settled:false,createdAt:Date.now(),repayments:[],incomeType:'投资'}
  ]
  var c=loans.find(function(l){return l.id==='seed_c'});c.repayments=repayFirst(c,2)
  var d=loans.find(function(l){return l.id==='seed_d'});d.repayments=repayFirst(d,1)
  saveBooks(books);saveLoans(loans);setActiveBookId(books[0].id)
}

/* ===== Router ===== */
var ROUTE_MAP={'':'index','#':'index','#!/':'index','#!/index':'index','#!/loans':'loans','#!/income':'income','#!/loanEdit':'loanEdit','#!/loanDetail':'loanDetail','#!/repaymentEdit':'repaymentEdit','#!/reminder':'reminder','#!/books':'books','#!/backup':'backup'}

/* ===== Layout shell ===== */
function shell(content,opts){
  opts=opts||{};var book=getActiveBook();var bn=book?book.name:'我的账本'
  var ti={'index':0,'loans':1,'income':2,'reminder':3}
  var tabs=['看板','借款','收入','提醒']
  var t='<div class="tabbar">'
  tabs.forEach(function(n,i){var k=['index','loans','income','reminder'][i];t+='<a href="#!/'+k+'" class="tab-item '+(opts.tab===k?'active':'')+'"><span class="tab-icon">'+(i===0?'\u{1F4CA}':i===1?'\u{1F4CB}':i===2?'\u{1F4B0}':'\u{1F514}')+'</span><span>'+n+'</span></a>'})
  t+='</div>'
  return '<div class="app"><div class="header"><div class="h-left" onclick="navigate(\'#!/index\')"><span class="h-title">借还记账</span></div><div class="h-center" onclick="navigate(\'#!/books\')"><span class="h-book">'+esc(bn)+'</span><span class="h-arrow">&#9660;</span></div><div class="h-right" onclick="navigate(\'#!/backup\')"><span class="h-gear">&#9881;</span></div></div><div class="content">'+content+'</div>'+t+'</div>'
}

/* ===== Render ===== */
function render(){
  var hash=window.location.hash||'#!/index'
  var page=ROUTE_MAP[hash]
  if(!page){
    var m=hash.match(/^#!\/loanDetail\?id=(.+)$/);if(m){page='loanDetail';window._detailId=m[1]}
    var m2=hash.match(/^#!\/repaymentEdit\?(.+)$/);if(m2){page='repaymentEdit';window._repayParams=parseParams(m2[1])}
  }
  if(!page)page='index'
  var html=''
  switch(page){
    case 'index':html=renderIndex();break
    case 'loans':html=renderLoans();break
    case 'income':html=renderIncome();break
    case 'loanEdit':html=renderLoanEdit();break
    case 'loanDetail':html=renderLoanDetail();break
    case 'repaymentEdit':html=renderRepaymentEdit();break
    case 'reminder':html=renderReminder();break
    case 'books':html=renderBooks();break
    case 'backup':html=renderBackup();break
  }
  qs('#app').innerHTML=shell(html,{tab:page==='index'?'index':page==='loans'?'loans':page==='income'?'income':page==='reminder'?'reminder':''})
  window.scrollTo(0,0)
  if(page==='index')bindIndex()
  else if(page==='loans')bindLoans()
  else if(page==='income')bindIncome()
  else if(page==='loanEdit')bindLoanEdit()
  else if(page==='loanDetail')bindLoanDetail()
  else if(page==='repaymentEdit')bindRepaymentEdit()
  else if(page==='reminder')bindReminder()
  else if(page==='books')bindBooks()
  else if(page==='backup')bindBackup()
}
function parseParams(s){var o={};(s||'').split('&').forEach(function(p){var kv=p.split('=');if(kv[0])o[decodeURIComponent(kv[0])]=decodeURIComponent(kv[1]||'')});return o}

/* ========================== PAGES ========================== */

/* ---- 1. 概览看板 ---- */
function renderIndex(){
  var book=getActiveBook(),bn=book?book.name:''
  var all=getLoansAll(),bid=getActiveBookId()
  var loans=enrich(all.filter(function(l){return l.bookId===bid&&l.direction!=='income'}),todayStr())
  var incomes=all.filter(function(l){return l.bookId===bid&&l.direction==='income'})
  var lendP=0,borrowP=0,lendOut=0,borrowOut=0,overdue=0,incomeTotal=0
  loans.forEach(function(l){
    var p=Number(l.principal)||0,out=Number(l.remaining)||0
    if(l.direction==='lend'){lendP+=p;lendOut+=out;if(l.isOverdue)overdue+=out}
    else{borrowP+=p;borrowOut+=out}
  })
  incomes.forEach(function(l){incomeTotal+=Number(l.principal)||0})
  var recent=loans.slice(0,5)
  var overdueCount=loans.filter(function(l){return l.isOverdue}).length
  var nearCount=loans.filter(function(l){return l.remaining>0&&l.daysToDue!==null&&l.daysToDue>=0&&l.daysToDue<=7}).length
  var h='<div class="cards">'
  h+='<div class="card"><div class="card-title">'+esc(bn)+' <span class="muted">数据概览</span></div><div class="stat-row2"><div class="stat-box"><div class="stat-label">累计借出</div><div class="stat-val green">'+money(lendP)+'</div></div><div class="stat-box"><div class="stat-label">累计贷款</div><div class="stat-val blue">'+money(borrowP)+'</div></div></div><div class="stat-row3"><div class="stat-mini"><div class="mini-label">待收回</div><div class="mini-val">'+money(lendOut)+'</div></div><div class="stat-mini"><div class="mini-label">待还</div><div class="mini-val">'+money(borrowOut)+'</div></div><div class="stat-mini" style="background:#e8f5e9"><div class="mini-label">累计收入</div><div class="mini-val green">'+money(incomeTotal)+'</div></div></div></div>'
  if(overdueCount>0||nearCount>0){
    h+='<div class="card alert-card"><div class="alert-row">'
    if(overdueCount>0)h+='<span class="alert-badge red-badge">逾期 '+overdueCount+' 笔</span>'
    if(nearCount>0)h+='<span class="alert-badge orange-badge">临近 '+nearCount+' 笔</span>'
    h+='</div></div>'
  }
  h+='<div class="card"><div class="card-title">最近借贷 <a href="javascript:navigate(\'#!/loans\')" class="more">全部</a></div>'
  recent.forEach(function(l){
    var c=enrich([l],todayStr())[0];if(!c)return
    h+='<div class="loan-row" onclick="navigate(\'#!/loanDetail?id='+l.id+'\')"><div class="lr-left"><span class="'+dirClass(l.direction)+'">'+dirText(l.direction)+'</span><span class="lr-name">'+esc(l.name||'未命名')+'</span></div><div class="lr-right"><span class="lr-amount">'+money(l.remaining,l.currency)+'</span><span class="lr-status '+statusClass(c.status)+'">'+statusText(c.status)+'</span></div></div>'
  })
  h+='</div></div>'
  return h
}
function bindIndex(){} 
function setLoansFilter(f){window._loansFilter=f;render()}
function setLoansKw(v){window._loansKw=v;render()}

/* ---- 2. 借贷列表 ---- */
function renderLoans(){
  var f=window._loansFilter||'all'
  var all=getLoans(getActiveBookId())
  var loans=enrich(all.filter(function(l){return l.direction!=='income'}),todayStr())
  if(f==='lend')loans=loans.filter(function(l){return l.direction==='lend'})
  else if(f==='borrow'||f==='loan')loans=loans.filter(function(l){return l.direction==='loan'||l.direction==='borrow'})
  else if(f==='active')loans=loans.filter(function(l){return l.status==='active'})
  else if(f==='overdue')loans=loans.filter(function(l){return l.status==='overdue'})
  else if(f==='paid')loans=loans.filter(function(l){return l.status==='paid'})
  var kw=(window._loansKw||'').toLowerCase()
  if(kw)loans=loans.filter(function(l){return(l.name||'').toLowerCase().indexOf(kw)>=0||(l.contact||'').toLowerCase().indexOf(kw)>=0})
  var h='<div class="card"><div class="filter-bar"><a href="javascript:setLoansFilter(\'all\')" class="filter-item '+(f==='all'?'f-active':'')+'">全部</a><a href="javascript:setLoansFilter(\'lend\')" class="filter-item '+(f==='lend'?'f-active':'')+'">借出</a><a href="javascript:setLoansFilter(\'loan\')" class="filter-item '+(f==='loan'||f==='borrow'?'f-active':'')+'">贷款</a><a href="javascript:setLoansFilter(\'active\')" class="filter-item '+(f==='active'?'f-active':'')+'">进行中</a><a href="javascript:setLoansFilter(\'overdue\')" class="filter-item '+(f==='overdue'?'f-active':'')+'">逾期</a><a href="javascript:setLoansFilter(\'paid\')" class="filter-item '+(f==='paid'?'f-active':'')+'">已结清</a></div><div class="search-bar"><input placeholder="搜索对方姓名/联系方式" value="'+esc(window._loansKw||'')+'" oninput="setLoansKw(this.value)"/></div></div>'
  loans.forEach(function(l){
    var c=enrich([l],todayStr())[0]
    var tag=(l.planMethod&&l.planMethod!=='lump')?l.planMethod==='equalInstallment'?'等额本息':'等额本金':''
    h+='<div class="loan-row" onclick="navigate(\'#!/loanDetail?id='+l.id+'\')"><div class="lr-left"><span class="'+dirClass(l.direction)+'">'+dirText(l.direction)+'</span><span class="lr-name">'+esc(l.name||'未命名')+'</span>'+(tag?'<span class="plan-tag">'+tag+'</span>':'')+'</div><div class="lr-right"><span class="lr-amount">'+money(l.remaining,l.currency)+'</span><span class="lr-status '+statusClass(c.status)+'" onclick="event.stopPropagation();showStatusEdit(\''+l.id+'\')">'+statusText(c.status)+'</span></div></div>'
  })
  if(loans.length===0)h+='<div class="card"><div class="empty">暂无可记录的借贷</div></div>'
  h+='<div class="fab" onclick="navigate(\'#!/loanEdit\')">+</div>'
  return h
}
function bindLoans(){}

/* ---- 2.5 收入列表 ---- */
function renderIncome(){
  var all=getLoans(getActiveBookId()).filter(function(l){return l.direction==='income'})
  var h='<div class="card"><div class="card-title">收入记录</div>'
  var byType={}
  all.forEach(function(l){var t=l.incomeType||'其他';if(!byType[t])byType[t]=[];byType[t].push(l)})
  var typeOrder=['工资','投资','其他']
  typeOrder.forEach(function(t){
    var items=byType[t];if(!items||!items.length)return
    h+='<div class="card-title" style="font-size:13px;margin-top:8px;margin-bottom:4px">'+t+' ('+items.length+')</div>'
    items.sort(function(a,b){return(a.dueDate||'').localeCompare(b.dueDate||'')})
    items.forEach(function(l){
      var arrived=l.arrived!==undefined?l.arrived:(l.dueDate<=todayStr())
      h+='<div class="income-row" onclick="toggleIncomeArrived(\''+l.id+'\')"><div class="lr-left"><span class="tag tag-income">'+esc(t)+'</span><span class="lr-name">'+esc(l.name||'未命名')+'</span></div><div class="lr-right"><span class="lr-amount">'+money(l.principal)+'</span><span class="lr-status '+(arrived?'tag tag-paid':'tag tag-active')+'">'+(arrived?'已到账':'待入账')+'</span></div></div>'
    })
  })
  if(all.length===0)h+='<div class="empty">暂无收入记录</div>'
  h+='<div class="fab" onclick="navigate(\'#!/loanEdit\')">+</div></div>'
  return h
}
function bindIncome(){}
function toggleIncomeArrived(id){
  var l=getLoanById(id)
  if(l){l.arrived=l.arrived!==undefined?!l.arrived:(l.dueDate<=todayStr()?false:true);upsertLoan(l);render()}
}

/* ---- 3. 编辑（借贷/收入共用） ---- */
function renderLoanEdit(){
  var id=window._editLoanId||''
  var loan=getLoanById(id)
  var dir=(loan?loan.direction:'lend')==='income'?'income':(loan?loan.direction:'lend')==='borrow'?'loan':(loan?loan.direction||'lend':'lend')
  var f=loan||{direction:dir,name:'',contact:'',principal:'',currency:'¥',rate:'',interestType:'不计息',planMethod:'lump',planFreq:'monthly',startDate:'',dueDate:'',note:'',incomeType:'工资'}
  var h='<div class="card"><div class="card-title">'+(id?'编辑':'新增')+'</div>'
  h+='<div class="form-group"><label>类型</label><div class="seg-control" id="dirSeg"><span class="seg-item '+(dir==='lend'?'seg-on':'')+'" data-dir="lend" onclick="window._efD=\'lend\';document.querySelectorAll(\'#dirSeg .seg-item\').forEach(function(e){e.classList.remove(\'seg-on\')});this.classList.add(\'seg-on\');toggleDirFields()">借出</span><span class="seg-item '+(dir==='loan'?'seg-on':'')+'" data-dir="loan" onclick="window._efD=\'loan\';document.querySelectorAll(\'#dirSeg .seg-item\').forEach(function(e){e.classList.remove(\'seg-on\')});this.classList.add(\'seg-on\');toggleDirFields()">贷款</span><span class="seg-item '+(dir==='income'?'seg-on':'')+'" data-dir="income" onclick="window._efD=\'income\';document.querySelectorAll(\'#dirSeg .seg-item\').forEach(function(e){e.classList.remove(\'seg-on\')});this.classList.add(\'seg-on\');toggleDirFields()">收入</span></div></div>'
  h+='<div id="lf" style="display:'+(dir==='income'?'none':'block')+'">'
  h+='<div class="form-group"><label>对方名称 *</label><input class="f-input" id="f_name" value="'+esc(f.name)+'" placeholder="必填"/></div>'
  h+='<div class="form-group"><label>联系方式</label><input class="f-input" id="f_contact" value="'+esc(f.contact||'')+'" placeholder="选填"/></div>'
  h+='<div class="form-row2"><div class="form-group"><label>金额 *</label><input class="f-input" id="f_principal" value="'+esc(f.principal)+'" placeholder="0" type="number"/></div><div class="form-group"><label>币种</label><input class="f-input" id="f_currency" value="'+esc(f.currency||'¥')+'" placeholder="¥"/></div></div>'
  h+='<div class="form-row2"><div class="form-group"><label>年化利率 %</label><input class="f-input" id="f_rate" value="'+esc(f.rate)+'" placeholder="0=无息" type="number"/></div><div class="form-group"><label>计息方式</label><select class="f-input" id="f_interestType"><option value="不计息" '+(f.interestType==='不计息'?'selected':'')+'>不计息</option><option value="单利" '+(f.interestType==='单利'?'selected':'')+'>单利</option><option value="复利" '+(f.interestType==='复利'?'selected':'')+'>复利</option></select></div></div>'
  h+='<div class="form-row2"><div class="form-group"><label>借款日期 *</label><input class="f-input" id="f_startDate" value="'+esc(f.startDate)+'" type="date"/></div><div class="form-group"><label>约定还款日 *</label><input class="f-input" id="f_dueDate" value="'+esc(f.dueDate)+'" type="date"/></div></div>'
  h+='<div class="form-group"><label>还款方式</label><select class="f-input" id="f_planMethod" onchange="togglePlanFreq()"><option value="lump" '+(f.planMethod==='lump'?'selected':'')+'>一次性还本付息</option><option value="interestFirst" '+(f.planMethod==='interestFirst'?'selected':'')+'>先息后本</option><option value="equalInstallment" '+(f.planMethod==='equalInstallment'?'selected':'')+'>等额本息</option><option value="equalPrincipal" '+(f.planMethod==='equalPrincipal'?'selected':'')+'>等额本金</option></select></div>'
  h+='<div class="form-group" id="freqGroup" style="display:'+(f.planMethod&&f.planMethod!=='lump'?'block':'none')+'"><label>还款频率</label><select class="f-input" id="f_planFreq"><option value="weekly" '+(f.planFreq==='weekly'?'selected':'')+'>按周</option><option value="monthly" '+(f.planFreq==='monthly'?'selected':'')+'>按月</option><option value="quarterly" '+(f.planFreq==='quarterly'?'selected':'')+'>按季</option><option value="yearly" '+(f.planFreq==='yearly'?'selected':'')+'>按年</option></select></div>'
  h+='<div class="form-group"><label>备注</label><textarea class="f-input" id="f_note_loan" rows="2" placeholder="选填">'+esc(f.note||'')+'</textarea></div>'
  h+='<div class="form-group"><label class="chk-label"><input type="checkbox" id="f_settled" '+(f.settled?'checked':'')+'> 已结清（标记为已还清，不再显示逾期）</label></div>'
  h+='</div><div id="inf" style="display:'+(dir==='income'?'block':'none')+'">'
  h+='<div class="form-group"><label>收入名称 *</label><input class="f-input" id="f_name" value="'+esc(f.name)+'" placeholder="如：工资"/></div>'
  h+='<div class="form-group"><label>收入类型</label><select class="f-input" id="f_incomeType"><option value="工资" '+(f.incomeType==='工资'?'selected':'')+'>工资</option><option value="投资" '+(f.incomeType==='投资'?'selected':'')+'>投资</option><option value="其他" '+(f.incomeType==='其他'?'selected':'')+'>其他</option></select></div>'
  h+='<div class="form-group"><label>金额 *</label><input class="f-input" id="f_principal" value="'+esc(f.principal)+'" placeholder="0" type="number"/></div>'
  h+='<div class="form-group"><label>到账日期 *</label><input class="f-input" id="f_dueDate" value="'+esc(f.dueDate)+'" type="date"/></div>'
  h+='<div class="form-group"><label>备注</label><textarea class="f-input" id="f_note" rows="2" placeholder="选填">'+esc(f.note||'')+'</textarea></div>'
  h+='</div><div style="display:flex;gap:12px;margin-top:16px"><button class="btn btn-confirm" style="flex:1" onclick="saveLoan()">保存</button>'+(id?'<button class="btn btn-cancel" style="flex:1" onclick="deleteLoanConfirm()">删除</button>':'')+'</div></div>'
  return h
}
function togglePlanFreq(){var v=document.getElementById('f_planMethod')?.value;if(v)document.getElementById('freqGroup').style.display=(v==='lump'?'none':'block')}
function toggleDirFields(){var d=window._efD||'lend';var lf=document.getElementById('lf');if(lf)lf.style.display=(d==='income'?'none':'block');var inf=document.getElementById('inf');if(inf)inf.style.display=(d==='income'?'block':'none')}
function saveLoan(){
  window._efD=window._efD||'lend';var d={direction:window._efD,name:document.getElementById('f_name').value.trim(),contact:'',principal:parseFloat(document.getElementById('f_principal').value)||0,currency:'¥',rate:0,interestType:'不计息',planMethod:'lump',planFreq:'monthly',startDate:'',dueDate:'',note:'',incomeType:'工资',settled:false,arrived:false}
  if(d.direction==='income'){
    d.dueDate=document.getElementById('f_dueDate').value
    d.incomeType=document.getElementById('f_incomeType').value
    d.note=document.getElementById('f_note').value.trim()
    d.arrived=document.getElementById('f_arrived').checked
  }else{
    d.contact=document.getElementById('f_contact').value.trim();d.currency=document.getElementById('f_currency').value.trim()||'¥'
    d.rate=parseFloat(document.getElementById('f_rate').value)||0;d.interestType=document.getElementById('f_interestType').value
    d.startDate=document.getElementById('f_startDate').value;d.dueDate=document.getElementById('f_dueDate').value
    d.planMethod=document.getElementById('f_planMethod').value;d.planFreq=document.getElementById('f_planFreq').value
    d.note=document.getElementById('f_note_loan').value.trim()
    d.settled=document.getElementById('f_settled').checked
  }
  if(!d.name){showToast('名称不能为空');return}
  if(d.direction!=='income'&&(!d.startDate||!d.dueDate)){showToast('请选择日期');return}
  var id=window._editLoanId||'';var existing=getLoanById(id)
  var loan={id:id||genId('L'),bookId:getActiveBookId(),direction:d.direction,name:d.name,contact:d.contact,principal:d.principal,currency:d.currency,rate:d.rate,interestType:d.interestType,planMethod:d.planMethod,planFreq:d.planFreq,incomeType:d.direction==='income'?d.incomeType:undefined,arrived:d.direction==='income'?d.arrived:undefined,startDate:d.direction==='income'?d.dueDate:d.startDate,dueDate:d.dueDate,note:d.note,settled:d.settled,createdAt:existing&&existing.createdAt||Date.now(),repayments:existing&&existing.repayments||[]}
  // 自动填充已过期期次为已还（仅新增分期贷款）
  if(!id&&d.direction!=='income'&&!d.settled&&d.planMethod&&d.planMethod!=='lump'){
    var _plan=genPlan(loan,todayStr())
    var _autoReps=[]
    _plan.periods.forEach(function(p){
      if(p.dueDate<todayStr()&&!loan.repayments.some(function(r){return r.planIndex===p.index})){
        _autoReps.push({id:genId('R'),amount:r2(p.total),date:p.dueDate,method:'代扣',note:'自动填充（历史期次）',planIndex:p.index,principalPortion:r2(p.principal),interestPortion:r2(p.interest)})
      }
    })
    _autoReps.reverse().forEach(function(r){loan.repayments.unshift(r)})
  }
  upsertLoan(loan);showToast('保存成功');window._editLoanId='';if(d.direction==='income')navigate('#!/income');else navigate('#!/loanDetail?id='+loan.id)
}
function deleteLoanConfirm(){showModal('确认删除','删除不可恢复，继续？',function(ok){if(ok){deleteLoan(window._editLoanId||'');showToast('已删除');window._editLoanId='';navigate('#!/loans')}})}
function bindLoanEdit(){window._efD=document.querySelector('#dirSeg .seg-on')?.dataset?.dir||'lend'}
/* ---- 4. 借款详情 ---- */
function renderLoanDetail(){
  var id=window._detailId||''
  var raw=getLoanById(id);if(!raw)return '<div class="card"><div class="empty">借款不存在</div></div>'
  var c=computeLoan(raw,todayStr())
  var l=Object.assign({},raw,c,decorate({direction:raw.direction,status:c.status}))
  var h='<div class="card"><div class="detail-header"><span class="'+dirClass(raw.direction)+'">'+dirText(raw.direction)+'</span><span class="detail-name">'+esc(raw.name)+'</span></div>'
  if(raw.contact)h+='<div class="detail-contact">'+esc(raw.contact)+'</div>'
  h+='<div class="stat-row3"><div class="stat-mini"><div class="mini-label">已还</div><div class="mini-val">'+money(c.totalRepaid)+'</div></div><div class="stat-mini"><div class="mini-label">剩余本金</div><div class="mini-val green">'+money(c.remaining)+'</div></div><div class="stat-mini"><div class="mini-label">应付利息</div><div class="mini-val">'+money(c.interest)+'</div></div></div>'
  if(c.isOverdue)h+='<div class="alert red-alert" onclick="showStatusEdit(\''+raw.id+'\')">已逾期'+Math.abs(c.daysToDue)+'天，请尽快处理</div>'
  else if(c.daysToDue!==null&&c.daysToDue>=0&&c.status!=='paid')h+='<div class="alert orange-alert" onclick="showStatusEdit(\''+raw.id+'\')">距下一期还有 '+c.daysToDue+' 天（'+c.effectiveDueDate+'）</div>'
  h+='</div>'

  // 还款计划表
  if(raw.planMethod&&raw.planMethod!=='lump'){
    var plan=c.plan;var planLabel={'equalInstallment':'等额本息','equalPrincipal':'等额本金','interestFirst':'先息后本'}[raw.planMethod]||''
    h+='<div class="card"><div class="card-title">还款计划表 · '+planLabel+' '+({'weekly':'按周','monthly':'按月','quarterly':'按季','yearly':'按年'}[raw.planFreq]||'')+' '+plan.periodCount+'期</div>'
    h+='<div class="plan-table"><div class="plan-table-inner"><div class="plan-tr plan-th"><span class="plan-c">#</span><span class="plan-c">应还日</span><span class="plan-c">本金</span><span class="plan-c">利息</span><span class="plan-c">合计</span><span class="plan-c plan-act"></span></div>'
    plan.periods.forEach(function(p){
      var pc='plan-tr'+(p.status==='paid'?' plan-paid':'')+(p.isNext?' plan-next':'')
      h+='<div class="'+pc+'"><span class="plan-c">#'+(p.index+1)+'</span><span class="plan-c">'+(p.dueDate||'')+'</span><span class="plan-c">'+money(p.principal)+'</span><span class="plan-c">'+money(p.interest)+'</span><span class="plan-c">'+money(p.total)+'</span><span class="plan-c plan-act" onclick="showPeriodEdit(\''+raw.id+'\','+p.index+')"><span class="tag '+(p.status==='paid'?'tag-paid':'tag-coming')+'">'+(p.status==='paid'?'已还':'待还')+'</span></span></div>'
    })
    h+='</div></div></div>'
  }else{
    h+='<div class="card"><div class="card-title">还款信息</div><div class="info-row"><span>本金</span><span>'+money(raw.principal)+'</span></div>'
    if(Number(raw.rate)>0)h+='<div class="info-row"><span>利率</span><span>'+raw.rate+'% ('+raw.interestType+')</span></div>'
    h+='<div class="info-row"><span>借款日</span><span>'+raw.startDate+'</span></div><div class="info-row"><span>约定还款日</span><span>'+raw.dueDate+'</span></div>'
    if(raw.note)h+='<div class="info-row"><span>备注</span><span>'+esc(raw.note)+'</span></div>'
    h+='</div>'
  }

  // 还款记录
  var reps=raw.repayments||[]
  h+='<div class="card"><div class="card-title">还款记录 ('+reps.length+') <a href="javascript:navigate(\'#!/repaymentEdit?loanId='+raw.id+'\')" class="more">+ 还款</a></div>'
  reps.forEach(function(r){
    h+='<div class="rep-row"><div class="rep-top"><span class="rep-amount">'+money(r.amount)+'</span><span class="rep-date">'+r.date+'</span></div><div class="rep-bottom"><span>'+(r.method?esc(r.method):'')+'</span>'+(r.planIndex!==undefined?'<span class="tag tag-active">第'+(r.planIndex+1)+'期</span>':'')+(r.note?'<span>'+esc(r.note)+'</span>':'')+'</div></div>'
  })
  if(reps.length===0)h+='<div class="empty">暂无还款记录</div>'
  h+='</div>'

  // 操作按钮
  h+='<div class="card"><div style="display:flex;gap:12px;flex-wrap:wrap">'
  h+='<button class="btn btn-confirm" style="flex:1" onclick="navigate(\'#!/repaymentEdit?loanId='+raw.id+'\')">新增还款</button>'
  h+='<button class="btn btn-cancel" style="flex:1" onclick="window._editLoanId=\''+raw.id+'\';navigate(\'#!/loanEdit\')">编辑借款</button>'
  if(c.status!=='paid')h+='<button class="btn btn-danger" style="flex:1" onclick="markSettled(\''+raw.id+'\')">标记结清</button>'
  h+='<button class="btn btn-blue" style="flex:1;background:#4084ff" onclick="moveLoanBook(\''+raw.id+'\')">移动到</button>'
  h+='</div></div>'
  return h
}
function bindLoanDetail(){}
function markSettled(id){showModal('确认结清','将这笔借款标记为「已结清」。确认继续？',function(ok){if(ok){var l=getLoanById(id);if(l){l.settled=true;upsertLoan(l);showToast('已标记结清');render()}}})}
function moveLoanBook(id){
  var l=getLoanById(id);if(!l)return
  var books=getBooks()
  if(books.length<=1){showToast('只有一个账本，无需移动');return}
  var opts=books.map(function(b,i){return{label:b.name+' ('+(b.id===l.bookId?'当前':'')+')',description:'移动到「'+b.name+'」'}})  
  showPrompt('移动到哪个账本？','','',function(v){
    for(var i=0;i<books.length;i++){
      if(String(i)===v&&books[i].id!==l.bookId){
        l.bookId=books[i].id;upsertLoan(l);showToast('已移动到「'+books[i].name+'」');render();return
      }
    }
    showToast('无效选择或同一账本')
  })
}
function showStatusEdit(id){
  var l=getLoanById(id);if(!l)return
  if(l.settled){showModal('当前已结清','标记为「进行中」？',function(ok){if(ok){l.settled=false;upsertLoan(l);showToast('已改为进行中');render()}})}
  else{showModal('当前进行中','标记为「已结清」？',function(ok){if(ok){l.settled=true;upsertLoan(l);showToast('已标记结清');render()}})}
}
function showPeriodEdit(loanId,idx){
  var l=getLoanById(loanId);if(!l)return
  var plan=genPlan(l,todayStr())
  if(!plan||!plan.periods[idx])return
  var p=plan.periods[idx]
  var isPaid=l.repayments.some(function(r){return r.planIndex===idx})
  showModal('第'+(idx+1)+'期 ('+p.dueDate+')','当前状态：'+(isPaid?'已还':'待还')+'\n确定要切换吗？',function(ok){
    if(!ok)return
    if(isPaid){
      // 取消已还：删除该期还款记录
      showModal('确认','取消已还会删除该期还款记录，继续？',function(ok2){
        if(ok2){l.repayments=l.repayments.filter(function(r){return r.planIndex!==idx});upsertLoan(l);showToast('已取消');render()}
      })
    }else{
      // 标记为已还：创建一条还款记录
      var r={id:genId('R'),amount:r2(p.total),date:p.dueDate,method:'手动',note:'长按标记已还',planIndex:idx,principalPortion:r2(p.principal),interestPortion:r2(p.interest)}
      upsertRepayment(loanId,r);showToast('已标记第'+(idx+1)+'期为已还');render()
    }
  })
}

/* ---- 5. 还款编辑 ---- */
function renderRepaymentEdit(){
  var p=window._repayParams||{}
  var loan=getLoanById(p.loanId)
  if(!loan)return '<div class="card"><div class="empty">借款不存在</div></div>'
  var repId=p.repId||'',existing=null
  if(repId)existing=(loan.repayments||[]).find(function(r){return r.id===repId})
  var planIdx=p.planIndex!==undefined?parseInt(p.planIndex):(existing&&existing.planIndex!==undefined?existing.planIndex:'')
  var c=enrich([loan],todayStr())[0];var plan=c.plan
  var prefillAmount='',prefillDate=todayStr()
  if(existing){prefillAmount=existing.amount;prefillDate=existing.date}
  else if(planIdx!==''&&plan&&plan.periods[planIdx]){prefillAmount=plan.periods[planIdx].total;prefillDate=plan.periods[planIdx].dueDate}
  var h='<div class="card"><div class="card-title">'+(repId?'编辑还款':'新增还款')+'</div><div class="info-row"><span>借款</span><span>'+esc(loan.name)+' ('+money(loan.principal)+')</span></div>'
  h+='<div class="form-group"><label>金额 *</label><input class="f-input" id="rf_amount" value="'+esc(prefillAmount)+'" type="number" step="0.01" placeholder="0.00"/></div>'
  h+='<div class="form-group"><label>日期</label><input class="f-input" id="rf_date" value="'+esc(prefillDate)+'" type="date"/></div>'
  h+='<div class="form-group"><label>方式</label><select class="f-input" id="rf_method"><option>现金</option><option>微信</option><option>支付宝</option><option selected>转账</option><option>其他</option></select></div>'
  if(planIdx!==''&&plan&&plan.periods[planIdx])h+='<div class="info-row"><span>关联期次</span><span>第'+(parseInt(planIdx)+1)+'期（合计'+money(plan.periods[planIdx].total)+'）</span></div>'
  h+='<div class="form-group"><label>备注</label><input class="f-input" id="rf_note" value="'+esc(existing?existing.note||'':'')+'" placeholder="选填"/></div>'
  h+='<div style="display:flex;gap:12px;margin-top:16px"><button class="btn btn-confirm" style="flex:1" onclick="saveRepayment()">保存</button>'+(repId?'<button class="btn btn-cancel" style="flex:1" onclick="deleteRepaymentConfirm()">删除</button>':'')+'</div></div>'
  window._repayLoanId=p.loanId;window._repayId=repId;window._repayPlanIndex=planIdx!==''?parseInt(planIdx):undefined
  return h
}
function saveRepayment(){
  var amount=parseFloat(document.getElementById('rf_amount').value)
  if(!amount||amount<=0){showToast('请输入有效金额');return}
  var r={id:window._repayId||genId('R'),amount:amount,date:document.getElementById('rf_date').value||todayStr(),method:document.getElementById('rf_method').value,note:document.getElementById('rf_note').value.trim()}
  if(window._repayPlanIndex!==undefined){
    var plan=genPlan(getLoanById(window._repayLoanId),todayStr())
    if(plan.periods[window._repayPlanIndex]){r.planIndex=window._repayPlanIndex;r.principalPortion=plan.periods[window._repayPlanIndex].principal;r.interestPortion=plan.periods[window._repayPlanIndex].interest}
  }
  upsertRepayment(window._repayLoanId,r)
  showToast('保存成功')
  navigate('#!/loanDetail?id='+window._repayLoanId)
}
function deleteRepaymentConfirm(){showModal('确认删除','删除不可恢复，确定？',function(ok){if(ok){deleteRepayment(window._repayLoanId,window._repayId);showToast('已删除');navigate('#!/loanDetail?id='+window._repayLoanId)}})}
function bindRepaymentEdit(){}

/* ---- 6. 提醒中心 ---- */
function renderReminder(){
  var lead=parseInt(localStorage.getItem('reminderLeadDays'))||7
  var all=enrich(getLoansAll(),todayStr())
  // 借贷逾期/临近
  var overdue=[],near=[]
  all.forEach(function(l){
    if(l.direction==='income'||!l.remaining||l.remaining<=0)return
    if(l.isOverdue)overdue.push(l)
    else if(l.daysToDue!==null&&l.daysToDue>=0&&l.daysToDue<=lead)near.push(l)
  })
  overdue.sort(function(a,b){return a.daysToDue-b.daysToDue})
  near.sort(function(a,b){return a.daysToDue-b.daysToDue})
  // 收入到账提醒
  var incomes=getLoansAll().filter(function(l){return l.direction==='income'})
  var upcomingIncomes=[]
  incomes.forEach(function(l){
    var d=l.dueDate
    if(d>=todayStr())upcomingIncomes.push({name:l.name,amount:l.principal,date:d,incomeType:l.incomeType||'收入',days:daysBetween(todayStr(),d)})
  })
  upcomingIncomes.sort(function(a,b){return a.days-b.days})
  // 月度还款分析（当月全部已还+待还）
  var monthStart=todayStr().slice(0,7)+'-01'
  var monthEnd=new Date(parseInt(todayStr().slice(0,4)),parseInt(todayStr().slice(5,7)),0).toISOString().slice(0,10)
  var loanPayments=[],incomeSchedule=[]
  all.forEach(function(l){
    if(l.direction==='income')return
    if(l.planMethod&&l.planMethod!=='lump'&&l.planFreq==='monthly'){
      var plan=enrich([l],todayStr())[0].plan
      if(plan&&plan.periods){
        plan.periods.forEach(function(p){
          if(p.dueDate>=monthStart&&p.dueDate<=monthEnd)
            loanPayments.push({name:l.name,amount:p.total,date:p.dueDate,status:p.paid?'已还':'待还'})
        })
      }
    }else if(l.dueDate){
      if(l.dueDate>=monthStart&&l.dueDate<=monthEnd)
        loanPayments.push({name:l.name,amount:Number(l.principal)||0,date:l.dueDate,status:l.settled?'已还':'待还'})
    }
  })
  incomes.forEach(function(l){
    if(l.dueDate>=monthStart&&l.dueDate<=monthEnd)
      incomeSchedule.push({name:l.name,amount:l.principal,date:l.dueDate,type:l.incomeType||'收入',status:l.arrived!==undefined?(l.arrived?'已到账':'待入账'):(l.dueDate<=todayStr()?'已到账':'待入账')})
  })
  var h='<div class="card"><div class="card-title">提醒中心</div><div class="slide-row"><span>提前提醒 '+lead+' 天</span><input type="range" min="1" max="30" value="'+lead+'" oninput="setLead(this.value)" style="flex:1"/></div></div>'
  h+='<div class="card"><div class="card-title red">已逾期 ('+overdue.length+')</div>'
  overdue.forEach(function(l){
    var c=enrich([l],todayStr())[0]
    h+='<div class="remind-card remind-overdue" onclick="navigate(\'#!/loanDetail?id='+l.id+'\')"><div class="lr-left"><span class="'+dirClass(l.direction)+'">'+dirText(l.direction)+'</span><span class="lr-name">'+esc(l.name)+'</span></div><div class="lr-right"><span class="red">逾期 '+(c.daysToDue*-1)+' 天</span><span>'+money(c.remaining,l.currency)+'</span></div></div>'
  })
  if(overdue.length===0)h+='<div class="empty">暂无逾期</div>'
  h+='</div>'
  h+='<div class="card"><div class="card-title orange">临近还款 ('+near.length+')</div>'
  near.forEach(function(l){
    var c=enrich([l],todayStr())[0]
    h+='<div class="remind-card remind-near" onclick="navigate(\'#!/loanDetail?id='+l.id+'\')"><div class="lr-left"><span class="'+dirClass(l.direction)+'">'+dirText(l.direction)+'</span><span class="lr-name">'+esc(l.name)+'</span></div><div class="lr-right"><span class="orange">剩 '+c.daysToDue+' 天</span><span>'+money(c.remaining,l.currency)+'</span></div></div>'
  })
  if(near.length===0)h+='<div class="empty">暂无临近还款</div>'
  h+='</div>'
  // 收入到账提醒
  h+='<div class="card"><div class="card-title green">即将到账的收入 ('+upcomingIncomes.length+')</div>'
  upcomingIncomes.forEach(function(inc){
    h+='<div class="remind-card remind-near" style="border-left-color:#07c160"><div class="lr-left"><span class="tag tag-income">'+esc(inc.incomeType)+'</span><span class="lr-name">'+esc(inc.name)+'</span></div><div class="lr-right"><span class="green">'+money(inc.amount)+'</span><span class="muted" style="margin-left:6px">'+inc.date+'</span></div></div>'
  })
  if(upcomingIncomes.length===0)h+='<div class="empty">暂无待入账收入</div>'
  h+='</div>'
  // 月度还款分析（仅当月 1 号到月底）
  var thisMonthLoans=loanPayments.filter(function(p){return p.date>=monthStart&&p.date<=monthEnd})
  var thisMonthIncomes=incomeSchedule.filter(function(p){return p.date>=monthStart&&p.date<=monthEnd})
  var pendingTotal=0
  thisMonthLoans.forEach(function(p){pendingTotal+=Number(p.amount)||0})
  var incomeTotal=0
  thisMonthIncomes.forEach(function(inc){incomeTotal+=Number(inc.amount)||0})
  var monthLabel=todayStr().slice(0,7)
  window._bdLoans=thisMonthLoans;window._bdIncomes=thisMonthIncomes
  h+='<div class="card"><div class="card-title">还款能力分析 <span class="muted">'+monthLabel+'</span></div><div class="stat-row2"><div class="stat-box" onclick="showBreakdown(\'loan\')"><div class="stat-label">本月待还</div><div class="stat-val red">'+money(pendingTotal)+'</div></div><div class="stat-box" onclick="showBreakdown(\'income\')"><div class="stat-label">本月待入账</div><div class="stat-val green">'+money(incomeTotal)+'</div></div></div>'
  if(incomeTotal>0){
    var diff=incomeTotal-pendingTotal
    h+='<div class="alert '+(diff>=0?'orange-alert':'red-alert')+'">收入比待还高 '+money(Math.abs(diff))+'，'+(diff>=0?'还款压力可控':'存在缺口')+'</div>'
  }
  h+='</div>'
  return h
}
function setLead(v){localStorage.setItem('reminderLeadDays',v);render()}
function bindReminder(){}
function showBreakdown(type,sortBy,sortDesc){
  var items=type==='loan'?window._bdLoans||[]:window._bdIncomes||[]
  var title=type==='loan'?'本月待还明细':'本月待入账明细'
  if(items.length===0){showModal(title,'暂无本月数据');return}
  sortBy=sortBy||'date';sortDesc=sortDesc||false
  var sorted=items.slice().sort(function(a,b){
    var va=a[sortBy],vb=b[sortBy]
    if(typeof va==='number'&&typeof vb==='number')return sortDesc?vb-va:va-vb
    return sortDesc?String(vb).localeCompare(String(va)):String(va).localeCompare(String(vb))
  })
  var sortBtn=function(field,label){
    var active=sortBy===field?'background:#07c160;color:#fff;border-color:#07c160':''
    var arrow=sortBy===field?(sortDesc?' &#9660;':' &#9650;'):''
    return '<span style="cursor:pointer;padding:3px 8px;border-radius:12px;font-size:11px;border:1px solid #ddd;'+active+'" onclick="this.closest(\'div[style*=fixed]\').remove();showBreakdown(\''+type+'\',\''+field+'\','+(sortBy===field?!sortDesc:'false')+')">'+label+arrow+'</span>'
  }
  var html='<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">'+sortBtn('date','日期')+sortBtn('amount','金额')+'</div>'
  html+='<div style="max-height:280px;overflow-y:auto;text-align:left;font-size:13px">'
  html+='<div style="display:flex;padding:6px 0;border-bottom:1px solid #eee;font-weight:500"><span style="flex:1">名称</span><span>金额</span><span style="width:64px;text-align:center">状态</span><span style="width:74px;text-align:right">日期</span></div>'
  sorted.forEach(function(item){
    var sc=(item.status==='已还'||item.status==='已到账')?'color:#999':'color:#07c160'
    html+='<div style="display:flex;padding:6px 0;border-bottom:1px solid #f5f5f5;align-items:center">'
    html+='<span style="flex:1">'+esc(item.name)+'</span>'
    html+='<span style="'+(type==='loan'?'color:#ee4d2d':'color:#07c160')+'">'+money(item.amount)+'</span>'
    html+='<span style="width:64px;text-align:center;font-size:11px;'+sc+'">'+(item.status||'')+'</span>'
    html+='<span style="width:74px;text-align:right;color:#999">'+item.date+'</span></div>'
  })
  var total=sorted.reduce(function(s,p){return s+(Number(p.amount)||0)},0)
  html+='<div style="display:flex;padding:6px 0;font-weight:500"><span style="flex:1">合计</span><span>'+money(total)+'</span><span style="width:138px"></span></div>'
  html+='</div>'
  var d=document.createElement('div');d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:10000;display:flex;align-items:center;justify-content:center'
  d.innerHTML='<div style="background:#fff;border-radius:12px;width:340px;max-width:92%;padding:20px;box-shadow:0 4px 20px rgba(0,0,0,.15)"><div style="font-size:15px;font-weight:500;margin-bottom:8px;text-align:center">'+esc(title)+'</div>'+html+'<div style="text-align:center;margin-top:10px"><button class="btn btn-cancel" onclick="this.closest(\'div[style*=fixed]\').remove()" style="padding:8px 24px">关闭</button></div></div>'
  document.body.appendChild(d)
}

/* ---- 7. 账本管理 ---- */
function renderBooks(){
  var books=getBooks(),active=getActiveBookId()
  var h='<div class="card"><div class="card-title">账本管理</div>'
  books.forEach(function(b){
    h+='<div class="book-row" onclick="switchBook(\''+b.id+'\')"><span class="book-name'+(b.id===active?' active-book':'')+'">'+esc(b.name)+(b.id===active?' <span class="tag tag-lend">当前</span>':'')+'</span><span class="book-acts"><a href="javascript:renameBook(\''+b.id+'\',\''+esc(b.name)+'\')" class="op">改名</a>'+(books.length>1?'<a href="javascript:deleteBookConfirm(\''+b.id+'\')" class="op red" style="margin-left:12px">删除</a>':'')+'</span></div>'
  })
  h+='<div style="margin-top:12px"><button class="btn btn-confirm" style="width:100%" onclick="addNewBook()">+ 新建账本</button></div></div>'
  return h
}
function switchBook(id){setActiveBookId(id);render()}
function renameBook(id,name){showPrompt('修改账本名称','输入新名称',name,function(n){if(n&&n.trim()){renameBook_(id,n.trim());render()}})}
function renameBook_(id,n){renameBook(id,n)}
function deleteBookConfirm(id){showModal('确认删除','删除后该账本下的借款会转移到当前账本，确定？',function(ok){if(ok){var r=deleteBook(id);if(!r.ok)showToast(r.msg);else{showToast('已删除');render()}}})}
function addNewBook(){showPrompt('新建账本','输入账本名称','新账本',function(n){if(n&&n.trim()){addBook(n.trim());render()}})}
function bindBooks(){}

/* ---- 8. 数据备份 ---- */
function renderBackup(){
  var cfg=getGithubConfig()
  var count=getLoansAll().length
  var h='<div class="card"><div class="card-title">数据备份 <span class="muted">共 '+count+' 笔记录</span></div><div class="muted" style="margin-bottom:10px">导出后可通过下载保存；换设备后用导入JSON恢复。数据仅存本地。</div></div>'
  h+='<div class="card"><div class="card-title">导出</div><div class="btn-line" onclick="exportJson()">导出 JSON（全部账本+借款）<span class="muted">&#8250;</span></div><div class="btn-line" onclick="exportLoansCsv()">导出借款 CSV<span class="muted">&#8250;</span></div><div class="btn-line no-border" onclick="exportRepayCsv()">导出还款明细 CSV<span class="muted">&#8250;</span></div></div>'
  h+='<div class="card"><div class="card-title">导入</div><div class="btn-line no-border" onclick="importJson()"><span class="green">选择 JSON 文件导入</span><span class="muted">&#8250;</span></div><div class="muted" style="font-size:12px;margin-top:8px">导入时会询问「合并」或「覆盖」。</div></div>'
  h+='<div class="card"><div class="card-title">&#9729; 云同步（GitHub）<span class="muted" style="font-size:11px">家庭多设备共享</span></div>'
  h+='<div class="form-group"><label>GitHub Token</label><input class="f-input" id="gh_token" value="'+esc(cfg.token)+'" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" type="password"/></div>'
  h+='<div class="form-row2"><div class="form-group"><label>仓库 Owner</label><input class="f-input" id="gh_owner" value="'+esc(cfg.owner)+'" placeholder="你的GitHub用户名"/></div><div class="form-group"><label>仓库名</label><input class="f-input" id="gh_repo" value="'+esc(cfg.repo)+'" placeholder="repo-name"/></div></div>'
  h+='<button class="btn btn-confirm" style="width:100%;margin-bottom:10px" onclick="saveGithubConfig()">保存配置</button>'
  h+='<div style="display:flex;gap:8px"><button class="btn btn-confirm" style="flex:1" onclick="syncFromGithub()">&#9660; 从云端下载</button><button class="btn btn-blue" style="flex:1;background:#4084ff" onclick="syncToGithub()">&#9650; 上传到云端</button></div>'
  h+='<div id="ghStatus" class="muted" style="font-size:12px;margin-top:8px">'+(cfg.token&&cfg.owner&&cfg.repo?'已配置 &#10003;':'未配置，先填写上方信息')+'</div>'
  h+='</div>'
  h+='<div class="card"><div class="card-title">预览辅助</div><div class="btn-line no-border" onclick="restoreDemo()"><span class="muted">恢复内置示例数据（覆盖当前）</span><span class="muted">&#8250;</span></div><div class="btn-line no-border" onclick="clearAllData()"><span class="red">清空全部数据（不可恢复）</span><span class="muted">&#8250;</span></div><div class="muted" style="font-size:12px;margin-top:8px">首次打开会自动带示例数据。</div></div>'
  return h
}
function bindBackup(){}
function saveGithubConfig(){
  var cfg={token:document.getElementById('gh_token').value.trim(),owner:document.getElementById('gh_owner').value.trim(),repo:document.getElementById('gh_repo').value.trim()}
  if(!cfg.token||!cfg.owner||!cfg.repo){showToast('请完整填写三项信息');return}
  setGithubConfig(cfg)
  showToast('配置已保存')
  render()
}
function syncFromGithub(){
  var cfg=getGithubConfig()
  if(!cfg.token||!cfg.owner||!cfg.repo){showToast('请先配置 GitHub 信息');return}
  showToast('正在下载...')
  storeSyncFromGithub(function(res){
    if(res.ok){showToast(res.msg||'同步成功');render()}
    else{showToast(res.msg||'同步失败')}
  })
}
function syncToGithub(){
  var cfg=getGithubConfig()
  if(!cfg.token||!cfg.owner||!cfg.repo){showToast('请先配置 GitHub 信息');return}
  showToast('正在上传...')
  storeSyncToGithub(function(res){
    if(res.ok){showToast(res.msg||'上传成功');render()}
    else{showToast(res.msg||'上传失败')}
  })
}
function exportJson(){var d=exportAll();downloadFile(JSON.stringify(d,null,2),'借还记账_'+todayStr()+'.json')}
function exportLoansCsv(){downloadFile('\uFEFF'+csvLoans(),'借还记账_借款_'+todayStr()+'.csv')}
function exportRepayCsv(){downloadFile('\uFEFF'+csvRepayments(),'借还记账_还款_'+todayStr()+'.csv')}
function csvCell(v){var s=(v===undefined||v===null)?'':String(v);if(/[",\n]/.test(s))return '"'+s.replace(/"/g,'""')+'"';return s}
function csvLoans(){
  var h=['账本','方向','对方','联系方式','本金','币种','年化利率','计息方式','借款日期','约定还款日','已还','剩余本金','状态','备注']
  var books=getBooks()
  var rows=getLoansAll().map(function(l){var c=enrich([l],todayStr())[0];return[books.find(function(b){return b.id===l.bookId})?.name||'',dirText(l.direction),l.name,l.contact,l.principal,l.currency,l.rate,l.interestType,l.startDate,l.dueDate,c.totalRepaid,c.remaining,statusText(c.status),l.note]})
  return[h].concat(rows).map(function(r){return r.map(csvCell).join(',')}).join('\n')
}
function csvRepayments(){
  var h=['账本','方向','对方','借款本金','还款金额','还款日期','方式','备注'],rows=[]
  getLoansAll().forEach(function(l){(l.repayments||[]).forEach(function(r){var b=getBooks().find(function(b){return b.id===l.bookId});rows.push([b?b.name:'',dirText(l.direction),l.name,l.principal,r.amount,r.date,r.method,r.note])})})
  return[h].concat(rows).map(function(r){return r.map(csvCell).join(',')}).join('\n')
}
function downloadFile(content,fileName){
  var blob=new Blob([content],{type:'application/octet-stream'})
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fileName;document.body.appendChild(a);a.click();setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(a.href)},100)
}
function importJson(){
  var inp=document.createElement('input');inp.type='file';inp.accept='.json';inp.onchange=function(e){
    var file=e.target.files[0];if(!file)return
    var reader=new FileReader()
    reader.onload=function(ev){
      try{
        var data=JSON.parse(ev.target.result)
        showModal('选择导入方式','合并（保留现有，同名覆盖）或覆盖（清空现有）？',function(ok){var mode=ok?'merge':'replace';var r=importAll(data,mode);if(r.ok)showToast('导入成功');else showToast(r.msg);render()})
      }catch(e){showToast('文件解析失败')}
    };reader.readAsText(file)
  };inp.click()
}
function restoreDemo(){showModal('恢复示例数据','这会覆盖当前全部数据，恢复到内置示例。确定继续？',function(ok){if(ok){seedDemoData();localStorage.setItem('seeded','1');showToast('已恢复示例');render()}})}
function clearAllData(){
  showModal('清空数据','确定清空所有账本和记录？此操作不可恢复！\n建议先导出 JSON 备份。',function(ok){
    if(ok){
      saveBooks([]);saveLoans([]);setActiveBookId('');localStorage.removeItem('seeded')
      ensureBooks()
      showToast('已清空')
      render()
    }
  })
}

/* ===== Init ===== */
ensureBooks()
if(getLoansAll().length===0&&!localStorage.getItem('seeded')){seedDemoData();localStorage.setItem('seeded','1')}
window.addEventListener('hashchange',render)
window.addEventListener('load',render)
