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
  var img=lb.querySelector('img'), atual=0;
  function visiveis(){return fotos.filter(function(f){return !f.hidden;});}
  function mostrar(i){var v=visiveis(); atual=(i+v.length)%v.length; img.src=v[atual].href; img.alt=v[atual].querySelector('img').alt;}
  fotos.forEach(function(f){f.addEventListener('click',function(e){e.preventDefault(); lb.hidden=false; document.body.style.overflow='hidden'; mostrar(visiveis().indexOf(f));});});
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
