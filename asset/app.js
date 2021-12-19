function copy2(data) {
    var aux = document.createElement("input");
    aux.setAttribute("value", data);
    document.body.appendChild(aux);
    aux.select();
    document.execCommand("copy");
    document.body.removeChild(aux);
}

function csv2arr(data){
    data = data.replace(/\r\n/gi,'\n');
    var f=0;
    var arr=[]
    var ar=['']
    for(var i=0; i<data.length; i++){
        if(data[i]=='"' ) f+=1;
        //if(data[i]=='"' && !(f%2)) continue;
        if(data[i]=='"' && data[i+1]=='"' && f%2) continue;
        if(data[i]=='"' && data[i-1]!='"' && f%2) continue 
        if(data[i]=='"' && data[i+1]!='"' && !(f%2)) continue 
    
        if(data[i]=='\n' && !(f%2)) {arr.push(ar.slice()); ar=['']}
        else if(data[i]==',' && !(f%2)) ar.push('');
        else ar[ar.length-1]+=data[i]
    }
    return arr;
}


function count(str, fnd){
	fnd = fnd.split('')
	sum=0;
	for(var i=0; i<str.length-fnd.length+1; i++) sum+=fnd.every((v,j)=>{return v==str[j+i]})
return sum
}


const app = {
    problem:[],
    prepm:[],
    log:[],
    indlist:[],//유저가 요청한 답
    wromg_pms:false,
    getproblem:(callback)=>{
        fetch('../data/problem.csv').then(d=>d.text()).then(d=>{
            app.problem = csv2arr(d)
            console.log(app.problem)
            if(callback && typeof callback=='function') callback()
        })
    },
    show_pm:(ind)=>{
        if(!app.problem.length || !ind || isNaN(ind) || ind<=0 || ind>=app.problem.length) return
        if(Array.isArray(app.wromg_pms)&&!app.wromg_pms.includes(Number(ind))) app.wromgmode_out()
        const val = app.problem[ind]
        app.prepm = val;//현제 문제 정보
        app.indlist = [];//요청한 정답 초기화
        const ele = document.getElementById('show_pm')
        const pmhd = document.getElementById('pmhd')
        const pmind = document.getElementById('pmind')
        const opts = document.getElementById('opts')
        const imgs = document.getElementById('imgs')
        const show_com = document.getElementById('show_com')
        const show_com_txt = document.getElementById('show_com_txt')
        const show_ans = document.getElementById('show_ans')
        pmind.innerHTML = ind<10?'00'+ind:ind<100?'0'+ind:ind;
        show_com.style.display = 'none'
        show_com_txt.innerHTML = ''
        show_ans.innerHTML = ''
        show_ans.style.backgroundColor=''
        //console.log(val)
        const cirnum = ['①','②','③','④','⑤']
        const a = val[1].replace(/<br>/gi,' ')
        const b = cirnum.map(v=>a.indexOf(v))
        const pm = a.substring(0,b[0]).replace('(홈페이지 참조)','').trim()
        const opt = [];

        for(let i in b) if(b[i]!=-1){
            i=Number(i)
            //console.log('for',i)
            if(i==b.length-1 || b[i+1]==-1){//마지막
                //console.log('end')
                opt.push(a.substring(b[i],a.length))
            }else{
                //console.log('en',i,i+1,b[i],b[i+1],a.substring(b[i],b[i+1]))
                opt.push(a.substring(b[i],b[i+1]))
            }
        }
        //console.log(pm, opt,a,b)
        pmhd.innerHTML = pm
        opts.innerHTML = opt.map((v,i)=>`<div class="opt pm_${i+1}">${v}</div>`).join('\n')
        if(val[4]=='1') imgs.innerHTML = `<img src="../data/img/${val[0]}.jpg">`
        else if(val[4]=='2') {imgs.innerHTML = ''; opts.innerHTML = opt.map((v,i)=>`<div class="opt pm_${i+1}"><span>${v}</span><img src="../data/img/${val[0]}_${i+1}.jpg"></div>`).join('\n')}
        else if(val[5]=='1') imgs.innerHTML = `<video src="../data/video/${val[0]}.mp4" controls></video>`
        else imgs.innerHTML = ''
    },
    showans:(e)=>{
        if(!app.prepm || !app.prepm.length) return
        const target = e.target.tagName=='IMG' ?  e.target.parentElement : e.target;
        //console.log(target,target.classList,target.tagName)
        const cirnum = ['①','②','③','④','⑤']

        const ans = app.prepm[3].split(',').map(v=>v.trim())
        const ind = Number(target.classList[1].replace(/^pm_/,''))

        if(app.indlist.includes(ind) || isNaN(ind)) return;
        else if(app.indlist.length < ans.length){
            app.indlist.push(ind)
            target.style.backgroundColor = '#cccccc'
            app.indlist.sort((a,b)=>a>b);
        }else return
        

        if(app.indlist.length != ans.length) return;//아직 다 선택하지 않음

        const right  = ans.every((v,i)=>v==cirnum[app.indlist[i]-1])
        //console.log(ind, right )
        app.log.push([app.prepm[0],right])
        const show_ans = document.getElementById('show_ans')
        show_ans.style.backgroundColor=right?'#58FA58':'#F5A9A9'
        show_ans.innerHTML = `<b>답:&nbsp;</b>${ans}`
        app.showcom();
    },
    showcom:()=>{
        if(!app.prepm || !app.prepm.length) return
        
        const show_com = document.getElementById('show_com')
        show_com.style.display = "table-row"
        const show_com_txt = document.getElementById('show_com_txt')
        show_com_txt.innerHTML = `${app.prepm[2].replace(/<br>/gi,' ').replace(/■/gi,'<br>■').replace(/(\d+)\.\s/gi,'<br>$1. ').replace(/(\d+)\)/gi,'<br>$1)')}`
    },
    add_wrong:()=>{
        const wrongpm = document.getElementById('wrong_pm')
        if(Array.isArray(app.wromg_pms)) {
            app.wromgmode_out();
            return;
        }
        const pms = [...new Set(prompt('다시 풀어보기 기능입니다.\n틀린 문제들의 번호를 \'|\'로 구분하여 입력하십시오').split('|').map(v=>Number(v)))].sort((a,b)=>a>b)
        app.log = []
        if(pms.every(v=>!isNaN(v)&&1>=v&&v<app.problem.length)) {alert('잘못된 형식입니다'); return;}
        wrongpm.style.backgroundColor = '#cccccc'
        app.wromg_pms = pms
        document.getElementById('header_ind').value = pms[0]
        app.show_pm(pms[0])
    },
    wromgmode_out:()=>{
        const wrongpm = document.getElementById('wrong_pm')
        wrongpm.style.backgroundColor = '#ffffff'
        app.wromg_pms = false;
        return;
    },
    copywrongpm:()=>{
        const a = [...new Set(app.log.filter(v=>!v[1]).map(v=>Number(v[0])))].sort((a,b)=>a>b)
        const b = a.join('|').trim()
        console.log(b)
        if(!b) {alert('틀린 문제가 없습니다.'); return;}

        copy2(b)
        alert('오답이 복사되었습니다.')
    },nextpm:()=>{
        const headerind = document.getElementById('header_ind')
        if(Array.isArray(app.wromg_pms)){
            const ind = app.wromg_pms.indexOf(Number(headerind.value))
            console.log(ind, ind<app.wromg_pms.length-1)
            if(ind>=0 && ind<app.wromg_pms.length-1) headerind.value = app.wromg_pms[ind+1]-1
            else if(ind==-1){
                app.wromgmode_out();
                return;
            }else {alert('전부 풀었습니다.\n틀린 문제들을 다시 풀어보는 것은 어떤가요?'); return;}
        }
        if(headerind.value==app.problem.length) {alert('마지막 문제입니다.\n틀린 문제들을 다시 풀어보는 것은 어떤가요?'); return;}
        app.show_pm(++headerind.value)
    },
    befpm:()=>{
        const headerind = document.getElementById('header_ind')
        if(Array.isArray(app.wromg_pms)){
            const ind = app.wromg_pms.indexOf(Number(headerind.value))
            if(ind>=1) headerind.value = app.wromg_pms[ind-1]+1
            else if(ind==-1){
                app.wromgmode_out();
                return;
            }else {alert('첫 번째 문제입니다'); return;}
        }
        if(headerind.value==1) {alert('첫 번째 문제입니다'); return;}
        app.show_pm(--headerind.value)
        
    }
}