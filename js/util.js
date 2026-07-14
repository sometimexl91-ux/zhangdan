// 通用格式化与展示辅助（浏览器版，无 module.exports）
function money(n,currency){currency=currency||'¥';const v=Number(n)||0;const fixed=v.toFixed(2);const parts=fixed.split('.');parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');return currency+parts.join('.')}
function dirText(d){if(d==='lend')return '借出';if(d==='borrow'||d==='loan')return '贷款';if(d==='income')return '收入';return d||''}
function statusText(s){if(s==='overdue')return '逾期';if(s==='paid')return '已结清';return '进行中'}
function statusClass(s){if(s==='overdue')return 'tag tag-overdue';if(s==='paid')return 'tag tag-paid';return 'tag tag-active'}
function dirClass(d){if(d==='lend')return 'tag tag-lend';if(d==='borrow'||d==='loan')return 'tag tag-borrow';if(d==='income')return 'tag tag-income';return ''}
function decorate(loan){return Object.assign({},loan,{dirText:dirText(loan.direction),dirClass:dirClass(loan.direction),statusText:statusText(loan.status),statusClass:statusClass(loan.status),principalText:money(loan.principal,loan.currency),remainingText:money(loan.remaining,loan.currency),totalRepaidText:money(loan.totalRepaid,loan.currency),interestText:money(loan.interest,loan.currency)})}
