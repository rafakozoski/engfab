document.querySelectorAll('nav a').forEach(function(a){a.addEventListener('click',function(){var h=document.getElementById('topo');h.classList.remove('aberto');h.querySelector('.menu-btn').setAttribute('aria-expanded','false')})});

(function(){
  var f=document.getElementById('formOrc'); if(!f) return;
  var aviso=f.querySelector('.form-aviso'), bt=f.querySelector('.btn-enviar');
  f.addEventListener('submit',function(e){
    e.preventDefault(); aviso.className='form-aviso'; aviso.textContent='';
    var faltando=false;
    f.querySelectorAll('[required]').forEach(function(c){var ok=c.checkValidity();c.classList.toggle('erro',!ok);if(!ok)faltando=true;});
    if(faltando){aviso.className='form-aviso falha';aviso.textContent='Preencha os campos marcados.';return;}
    var arq=f.anexo.files[0];
    if(arq&&arq.size>2*1024*1024){aviso.className='form-aviso falha';aviso.textContent='O anexo passa de 2 MB.';return;}
    bt.disabled=true; bt.textContent='Enviando...';
    fetch(f.action,{method:'POST',body:new FormData(f)}).then(function(r){return r.json();}).then(function(d){
      aviso.className='form-aviso '+(d.ok?'ok':'falha'); aviso.textContent=d.msg; if(d.ok) f.reset();
    }).catch(function(){
      aviso.className='form-aviso falha'; aviso.textContent='Não conseguimos enviar agora. Chame no WhatsApp ou ligue (41) 3056-7005.';
    }).finally(function(){bt.disabled=false; bt.textContent='Enviar';});
  });
})();

// galeria: ampliação e filtro
(function(){
  var fotos=[].slice.call(document.querySelectorAll('a.foto'));
  if(!fotos.length) return;
  var lb=document.createElement('div'); lb.className='lb'; lb.hidden=true; lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true');
  lb.innerHTML='<img alt=""><button class="lb-fechar" aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button><button class="lb-ant" aria-label="Anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 6-6 6 6 6"/></svg></button><button class="lb-prox" aria-label="Próxima"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg></button>';
  document.body.appendChild(lb);
  var img=lb.querySelector('img'), atual=0, grupo=null;
  function visiveis(){var g=grupo?[].slice.call(grupo.querySelectorAll('a.foto')):fotos;return g.filter(function(f){return !f.hidden;});}
  function mostrar(i){var v=visiveis(); atual=(i+v.length)%v.length; img.src=v[atual].href; img.alt=v[atual].querySelector('img').alt;}
  fotos.forEach(function(f){f.addEventListener('click',function(e){e.preventDefault(); grupo=f.closest('.cat'); lb.hidden=false; document.body.style.overflow='hidden'; mostrar(visiveis().indexOf(f));});});
  function fechar(){lb.hidden=true; document.body.style.overflow=''; img.src='';}
  lb.querySelector('.lb-fechar').onclick=fechar;
  lb.querySelector('.lb-ant').onclick=function(){mostrar(atual-1);};
  lb.querySelector('.lb-prox').onclick=function(){mostrar(atual+1);};
  lb.addEventListener('click',function(e){if(e.target===lb) fechar();});
  document.addEventListener('keydown',function(e){if(lb.hidden) return; if(e.key==='Escape') fechar(); if(e.key==='ArrowLeft') mostrar(atual-1); if(e.key==='ArrowRight') mostrar(atual+1);});
  var bts=[].slice.call(document.querySelectorAll('.filtros button'));
  bts.forEach(function(b){b.addEventListener('click',function(){
    bts.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
    var c=b.dataset.cat; fotos.forEach(function(f){f.hidden=!(c==='todos'||f.dataset.cat===c);});
  });});
})();

// animações: blocos aparecem ao rolar, cabeçalho ganha sombra, número do "+10 anos" conta
(function(){
  var h=document.querySelector('header');
  function topo(){h&&h.classList.toggle('rolou',window.scrollY>10);}
  topo(); window.addEventListener('scroll',topo,{passive:true});
  if(!('IntersectionObserver' in window)) return;
  var sel='main section:not(.hero) .titulo,.cat,main section:not(.hero) .sub,.serv,.prod,.outro,.proj,.num,.card-esc,.card-clr,.hub,.post-card,.lista-card,.texto p,.contato-card,.mapa,.passos>*,.faq details,.logos-grid .logo-cli,.fotos .foto,.materiais,.artigo>*,.form-orc,.orc-contatos';
  var els=[].slice.call(document.querySelectorAll(sel));
  document.documentElement.classList.add('anima');
  els.forEach(function(el){
    var irmaos=[].filter.call(el.parentNode.children,function(x){return els.indexOf(x)>-1;});
    el.style.setProperty('--d',(Math.min(irmaos.indexOf(el),5)*0.08)+'s');
    el.classList.add('rv');
  });
  function limpa(el){el.classList.remove('rv','rv-on');el.style.removeProperty('--d');}
  var io=new IntersectionObserver(function(ent){ent.forEach(function(e){
    if(!e.isIntersecting) return;
    var el=e.target; io.unobserve(el); el.classList.add('rv-on');
    setTimeout(function(){limpa(el);},1400); // devolve os efeitos de hover originais
    var b=el.classList.contains('num')&&el.querySelector('b'), m=b&&b.textContent.match(/^\+(\d+)(.*)$/);
    if(m){var fim=+m[1],t0=null;(function passo(t){t0=t0||t;var p=Math.min((t-t0)/1200,1);b.textContent='+'+Math.round(fim*(1-Math.pow(1-p,3)))+m[2];if(p<1)requestAnimationFrame(passo);})(performance.now());}
  });},{rootMargin:'0px 0px -8% 0px',threshold:0.08});
  els.forEach(function(el){io.observe(el);});
})();

// portfólio: setas das faixas, "ver todas" por categoria e "ver todas as fotos"
(function(){
  var cats=[].slice.call(document.querySelectorAll('.cat')); if(!cats.length) return;
  cats.forEach(function(c){
    var t=c.querySelector('.cat-trilho'), ant=c.querySelector('.cat-ant'), prox=c.querySelector('.cat-prox'), abrir=c.querySelector('.cat-abrir');
    function setas(){ant.disabled=t.scrollLeft<=4; prox.disabled=t.scrollLeft+t.clientWidth>=t.scrollWidth-4;}
    ant.onclick=function(){t.scrollBy({left:-t.clientWidth,behavior:'smooth'});};
    prox.onclick=function(){t.scrollBy({left:t.clientWidth,behavior:'smooth'});};
    t.addEventListener('scroll',setas,{passive:true}); window.addEventListener('resize',setas); setas();
    abrir.onclick=function(){
      var a=c.classList.toggle('aberta'); abrir.setAttribute('aria-expanded',a); abrir.textContent=a?'Mostrar menos':'Ver todas';
      if(!a){t.scrollLeft=0; c.scrollIntoView({block:'start'}); window.scrollBy(0,-90);} setas();
    };
  });
  var bt=document.querySelector('.ver-tudo'), txt=bt&&bt.textContent;
  bt&&(bt.onclick=function(){
    var a=document.documentElement.classList.toggle('tudo-aberto'); bt.setAttribute('aria-pressed',a); bt.textContent=a?'Mostrar por categoria':txt;
    cats.forEach(function(c){var ab=c.querySelector('.cat-abrir'); c.classList.remove('aberta'); ab.textContent='Ver todas'; ab.setAttribute('aria-expanded','false'); ab.hidden=a; c.querySelector('.cat-trilho').scrollLeft=0;});
    if(!a){bt.scrollIntoView({block:'center'});}
  });
})();

// capa: troca as fotos de fundo a cada 6 segundos
(function(){
  var fotos=[].slice.call(document.querySelectorAll('.hero-capa .hero-fundo'));
  if(fotos.length<2) return;
  function carregar(){fotos.forEach(function(f){if(f.dataset.src){f.src=f.dataset.src;f.removeAttribute('data-src');}});}
  if(document.readyState==='complete') carregar(); else window.addEventListener('load',carregar);
  var i=0;
  setInterval(function(){
    if(document.hidden) return;
    var prox=(i+1)%fotos.length;
    if(!fotos[prox].complete||!fotos[prox].naturalWidth) return;
    fotos[i].classList.remove('ativo'); fotos[prox].classList.add('ativo'); i=prox;
  },6000);
})();
