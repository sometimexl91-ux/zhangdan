// 计息、还款计划与状态计算（纯函数，与小程序版一致）
function pad(n){return n<10?'0'+n:''+n}
function fmt(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function todayStr(){return fmt(new Date())}
function daysBetween(a,b){
  const da=new Date(a+'T00:00:00'),db=new Date(b+'T00:00:00')
  return Math.round((db-da)/86400000)
}
function parseDate(s){
  const p=(s||'').split('-').map(Number)
  return {y:p[0]||0,m:p[1]||0,d:p[2]||0}
}
function addMonths(dateStr,n){
  const a=parseDate(dateStr)
  const d=new Date(a.y,a.m-1,1)
  d.setMonth(d.getMonth()+n)
  const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate()
  d.setDate(Math.min(a.d,last))
  return fmt(d)
}
function periodDate(start,freq,k){
  if(freq==='weekly'){const d=new Date(start+'T00:00:00');d.setDate(d.getDate()+k*7);return fmt(d)}
  if(freq==='monthly')return addMonths(start,k)
  if(freq==='quarterly')return addMonths(start,k*3)
  if(freq==='yearly')return addMonths(start,k*12)
  return start
}
function periodsBetween(start,due,freq){
  if(freq==='weekly')return Math.max(1,Math.round(daysBetween(start,due)/7))
  if(freq==='yearly')return Math.max(1,parseDate(due).y-parseDate(start).y)
  const months=(parseDate(due).y-parseDate(start).y)*12+(parseDate(due).m-parseDate(start).m)
  if(freq==='quarterly')return Math.max(1,Math.round(months/3))
  return Math.max(1,months)
}
const PERIODS_PER_YEAR={weekly:52,monthly:12,quarterly:4,yearly:1}

function genPlan(loan,today){
  today=today||todayStr()
  const P=Number(loan.principal)||0,rate=Number(loan.rate)||0
  const method=loan.planMethod||'lump',freq=loan.planFreq||'monthly'
  const start=loan.startDate,due=loan.dueDate,reps=loan.repayments||[]
  const ppy=PERIODS_PER_YEAR[freq]||12,pr=rate/100/ppy
  let periods=[]
  if(method==='lump'){
    let interest=0
    if(rate>0&&start&&due){
      const r=rate/100,days=Math.max(0,daysBetween(start,due))
      interest=loan.interestType==='复利'?P*(Math.pow(1+r,days/365)-1):P*r*(days/365)
    }
    periods.push({index:0,dueDate:due||start,principal:P,interest:interest,total:P+interest,paid:false,paidDate:null,status:'upcoming'})
  }else{
    const n=periodsBetween(start,due,freq)
    if(method==='equalInstallment'){
      let pay=pr===0?P/n:P*pr*Math.pow(1+pr,n)/(Math.pow(1+pr,n)-1)
      let remaining=P
      for(let k=1;k<=n;k++){
        const interest=remaining*pr
        let principal=pay-interest
        if(k===n)principal=remaining
        remaining-=principal
        periods.push({index:k-1,dueDate:k===n?due:periodDate(start,freq,k),principal:principal,interest:interest,total:principal+interest,paid:false,paidDate:null,status:'upcoming'})
      }
    }else if(method==='interestFirst'){
      let remaining=P
      for(let k=1;k<=n;k++){
        const interest=remaining*pr
        const isLast=k===n
        const principal=isLast?remaining:0
        remaining-=principal
        periods.push({index:k-1,dueDate:isLast?due:periodDate(start,freq,k),principal:principal,interest:interest,total:principal+interest,paid:false,paidDate:null,status:'upcoming'})
      }
    }else{
      const pp=P/n
      let remaining=P
      for(let k=1;k<=n;k++){
        const interest=remaining*pr
        let principal=k===n?remaining:pp
        remaining-=principal
        periods.push({index:k-1,dueDate:k===n?due:periodDate(start,freq,k),principal:principal,interest:interest,total:principal+interest,paid:false,paidDate:null,status:'upcoming'})
      }
    }
  }
  reps.forEach(function(r){
    if(r.planIndex!==undefined&&r.planIndex!==null&&periods[r.planIndex]){
      const p=periods[r.planIndex];p.paid=true;p.paidDate=r.date||p.paidDate
    }
  })
  let totalInterest=0,firstUnpaid=-1
  periods.forEach(function(p){
    totalInterest+=p.interest
    if(!p.paid){if(firstUnpaid<0)firstUnpaid=p.index;p.status=p.dueDate<today?'overdue':'upcoming'}
    else p.status='paid'
  })
  if(firstUnpaid>=0)periods[firstUnpaid].isNext=true
  return{method:method,freq:freq,periods:periods,totalInterest:totalInterest,paidCount:periods.filter(function(p){return p.paid}).length,periodCount:periods.length,nextDue:firstUnpaid>=0?periods[firstUnpaid].dueDate:null}
}

function computeLoan(loan,today){
  today=today||todayStr()
  const P=Number(loan.principal)||0,reps=loan.repayments||[]
  const totalRepaid=reps.reduce(function(s,r){return s+(Number(r.amount)||0)},0)
  const principalRepaid=reps.reduce(function(s,r){return s+(r.principalPortion!==undefined?Number(r.principalPortion):(Number(r.amount)||0))},0)
  const remaining=Math.max(0,P-principalRepaid)
  const plan=genPlan(loan,today)
  const nextDue=plan.nextDue
  const effDue=(nextDue&&remaining>0)?nextDue:loan.dueDate
  const isOverdue=!!(effDue&&today>effDue&&remaining>0)
  const daysToDue=effDue?daysBetween(today,effDue):null
  let status
  if(loan.settled||remaining<=0)status='paid'
  else if(isOverdue)status='overdue'
  else status='active'
  return{totalRepaid:totalRepaid,remaining:remaining,interest:plan.totalInterest,isOverdue:isOverdue,daysToDue:daysToDue,effectiveDueDate:effDue,status:status,plan:plan}
}

function enrich(loans,today){
  today=today||todayStr()
  return(loans||[]).map(function(l){return Object.assign({},l,computeLoan(l,today))})
}
