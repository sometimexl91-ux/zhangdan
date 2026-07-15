// 数据层：浏览器 localStorage 版（替代 wx Storage）
var BOOKS_KEY='loan_books',ACTIVE_KEY='loan_active_bookId',LOANS_KEY='loan_loans'

function storageGet(key){try{var v=localStorage.getItem(key);return v?JSON.parse(v):null}catch(e){return null}}
function storageSet(key,val){localStorage.setItem(key,JSON.stringify(val))}

function genId(prefix){return(prefix||'id')+'_'+Date.now()+'_'+Math.floor(Math.random()*1000)}

/* ---------- 账本 ---------- */
function getBooks(){return storageGet(BOOKS_KEY)||[]}
function saveBooks(books){storageSet(BOOKS_KEY,books)}
function getActiveBookId(){return storageGet(ACTIVE_KEY)||''}
function setActiveBookId(id){storageSet(ACTIVE_KEY,id)}
function ensureBooks(){
  var books=getBooks()
  if(!books||books.length===0){
    var b={id:genId('B'),name:'我的账本',createdAt:Date.now()}
    books=[b];saveBooks(books);setActiveBookId(b.id)
  }
  if(!getActiveBookId()||!books.some(function(x){return x.id===getActiveBookId()}))
    setActiveBookId(books[0].id)
  return books
}
function getActiveBook(){var books=getBooks(),id=getActiveBookId();return books.find(function(b){return b.id===id})||books[0]||null}
function addBook(name){var books=getBooks(),b={id:genId('B'),name:(name||'新账本').trim()||'新账本',createdAt:Date.now()};books.push(b);saveBooks(books);return b}
function renameBook(id,name){var books=getBooks(),b=books.find(function(x){return x.id===id});if(b){b.name=(name||'').trim()||b.name;saveBooks(books)}}
function deleteBook(id){
  var books=getBooks()
  if(books.length<=1)return{ok:false,msg:'至少保留一个账本'}
  var remaining=books.filter(function(b){return b.id!==id}),target=(getActiveBookId()===id)?remaining[0].id:getActiveBookId()
  var loans=getLoansAll()
  loans.forEach(function(l){if(l.bookId===id)l.bookId=target})
  saveLoans(loans);saveBooks(remaining)
  if(getActiveBookId()===id)setActiveBookId(target)
  return{ok:true}
}

/* ---------- 借款 ---------- */
function getLoansAll(){return storageGet(LOANS_KEY)||[]}
function saveLoans(loans){storageSet(LOANS_KEY,loans)}
function getLoans(bookId){var all=getLoansAll(),bid=bookId||getActiveBookId();return all.filter(function(l){return l.bookId===bid})}
function getLoanById(id){return getLoansAll().find(function(l){return l.id===id})}
function upsertLoan(loan){var all=getLoansAll();if(!loan.bookId)loan.bookId=getActiveBookId();var idx=all.findIndex(function(l){return l.id===loan.id});if(idx>=0)all[idx]=loan;else all.unshift(loan);saveLoans(all);return loan}
function deleteLoan(id){saveLoans(getLoansAll().filter(function(l){return l.id!==id}))}
function upsertRepayment(loanId,rep){var loan=getLoanById(loanId);if(!loan)return;loan.repayments=loan.repayments||[];var idx=loan.repayments.findIndex(function(r){return r.id===rep.id});if(idx>=0)loan.repayments[idx]=rep;else loan.repayments.unshift(rep);upsertLoan(loan)}
function deleteRepayment(loanId,repId){var loan=getLoanById(loanId);if(!loan)return;loan.repayments=(loan.repayments||[]).filter(function(r){return r.id!==repId});upsertLoan(loan)}

/* ---------- GitHub 云同步 ---------- */
var GH_CONFIG_KEY='github_sync_config',GH_PATH='data.json',GH_BRANCH='main'

function getGithubConfig(){return storageGet(GH_CONFIG_KEY)||{token:'',owner:'',repo:''}}
function setGithubConfig(c){storageSet(GH_CONFIG_KEY,c)}

function b64DecodeUtf8(str){try{return decodeURIComponent(Array.from(atob(str)).map(function(c){return'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)}).join(''))}catch(e){return atob(str)}}
function b64EncodeUtf8(str){try{return btoa(Array.from(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,function(m,p){return String.fromCharCode(parseInt(p,16))})).join(''))}catch(e){return btoa(str)}}

// 读取 GitHub 上 data.json 的内容和 sha
function githubRead(cb){
  var cfg=getGithubConfig()
  if(!cfg.token||!cfg.owner||!cfg.repo){cb({ok:false,msg:'请先配置 GitHub Token'})}
  var url='https://api.github.com/repos/'+encodeURIComponent(cfg.owner)+'/'+encodeURIComponent(cfg.repo)+'/contents/'+encodeURIComponent(GH_PATH)
  var xhr=new XMLHttpRequest();xhr.open('GET',url,true)
  xhr.setRequestHeader('Authorization','Bearer '+cfg.token)
  xhr.setRequestHeader('Accept','application/vnd.github.v3+json')
  xhr.onload=function(){
    if(xhr.status===200||xhr.status===404){
      if(xhr.status===404){cb({ok:true,data:null,sha:null})}
      else{try{var r=JSON.parse(xhr.responseText);var decoded=b64DecodeUtf8(r.content);var parsed=JSON.parse(decoded);cb({ok:true,data:parsed,sha:r.sha})}catch(e){cb({ok:false,msg:'云端数据解析失败'})}}
    }else{cb({ok:false,msg:'读取失败 ('+xhr.status+')'})}
  };xhr.onerror=function(){cb({ok:false,msg:'网络错误'})};xhr.send()
}

// 写入 data.json 到 GitHub（需 sha，新文件传 null）
function githubWrite(data,sha,cb){
  var cfg=getGithubConfig()
  if(!cfg.token||!cfg.owner||!cfg.repo){cb({ok:false,msg:'请先配置 GitHub Token'})}
  var url='https://api.github.com/repos/'+encodeURIComponent(cfg.owner)+'/'+encodeURIComponent(cfg.repo)+'/contents/'+encodeURIComponent(GH_PATH)
  var body={message:'Sync loan data '+new Date().toISOString().slice(0,10),content:b64EncodeUtf8(JSON.stringify(data,null,2))}
  if(sha)body.sha=sha
  var xhr=new XMLHttpRequest();xhr.open('PUT',url,true)
  xhr.setRequestHeader('Authorization','Bearer '+cfg.token)
  xhr.setRequestHeader('Accept','application/vnd.github.v3+json')
  xhr.setRequestHeader('Content-Type','application/json')
  xhr.onload=function(){
    if(xhr.status>=200&&xhr.status<300){cb({ok:true})}
    else{try{var r=JSON.parse(xhr.responseText);cb({ok:false,msg:r.message||'写入失败'})}catch(e){cb({ok:false,msg:'写入失败 ('+xhr.status+')'})}}
  };xhr.onerror=function(){cb({ok:false,msg:'网络错误'})};xhr.send(JSON.stringify(body))
}

// 从云端下载 → 并导入本地（合并模式）
function storeSyncFromGithub(cb){
  githubRead(function(res){
    if(!res.ok){cb(res);return}
    if(!res.data){cb({ok:true,msg:'云端无数据'})}
    var r=importAll(res.data,'merge')
    cb({ok:true,msg:'云端数据已合并到本地，共 '+r.loans+' 笔'})
  })
}

// 上传本地数据到云端（先拉云端→合并→回写，避免覆盖家人数据）
function storeSyncToGithub(cb){
  githubRead(function(res){
    var local=exportAll()
    if(!res.ok&&res.msg!=='云端无数据'){cb(res);return}
    var merged=local
    if(res.data&&res.data.loans){
      // 以云端为基础，用本地数据覆盖/补充
      var cloudLoans=res.data.loans.slice()
      local.loans.forEach(function(ll){
        var idx=cloudLoans.findIndex(function(cl){return cl.id===ll.id})
        if(idx>=0)cloudLoans[idx]=ll;else cloudLoans.push(ll)
      })
      var cloudBooks=res.data.books.slice()
      local.books.forEach(function(lb){
        if(!cloudBooks.some(function(cb2){return cb2.id===lb.id}))cloudBooks.push(lb)
      })
      merged={app:local.app,version:local.version,exportedAt:new Date().toISOString(),books:cloudBooks,activeBookId:local.activeBookId,loans:cloudLoans}
    }
    githubWrite(merged,res.sha,function(wr){
      if(wr.ok)cb({ok:true,msg:'上传成功，共 '+merged.loans.length+' 笔'})
      else cb(wr)
    })
  })
}
function exportAll(){return{app:'loan-web',version:1,exportedAt:new Date().toISOString(),books:getBooks(),activeBookId:getActiveBookId(),loans:getLoansAll()}}
function importAll(data,mode){
  if(!data||!Array.isArray(data.loans))return{ok:false,msg:'文件格式不正确'};mode=mode||'merge'
  var loans=getLoansAll(),books=getBooks()
  ;(data.books||[]).forEach(function(b){if(!books.some(function(x){return x.id===b.id}))books.push(b)})
  if(mode==='replace'){loans=data.loans.slice()}else{data.loans.forEach(function(l){var idx=loans.findIndex(function(x){return x.id===l.id});if(idx>=0)loans[idx]=l;else loans.push(l)})}
  saveBooks(books);saveLoans(loans)
  if(data.activeBookId&&books.some(function(b){return b.id===data.activeBookId}))setActiveBookId(data.activeBookId)
  return{ok:true,loans:loans.length,books:books.length}
}
