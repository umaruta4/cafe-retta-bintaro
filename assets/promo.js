(function(){
  var list=document.getElementById('promo-list');
  var empty=document.getElementById('promo-empty');
  if(!list) return;
  var today=new Date().toISOString().slice(0,10);
  function escape(s){return String(s).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
  function fmtDate(s){if(!s) return '';var d=new Date(s+'T00:00:00');return d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});}
  function card(p){
    var tags=(p.tags||[]).map(function(t){return '<span class="tag">'+escape(t)+'</span>';}).join('');
    var items=(p.includes||[]).map(function(i){return '<li>'+escape(i)+'</li>';}).join('');
    var price=p.price?'<p class="price"><strong>'+escape(p.price)+'</strong><span>'+escape(p.price_label||'Harga')+'</span></p>':'';
    var range='';
    if(p.valid_from||p.valid_until){
      range='<small>'+(p.valid_from?fmtDate(p.valid_from):'…')+' – '+(p.valid_until?fmtDate(p.valid_until):'…')+'</small>';
    }
    return ''
      +'<article class="promo-card reveal">'
      +'  <a class="cover" href="'+escape(p.instagram_url||'#')+'" target="_blank" rel="noopener noreferrer" aria-label="Lihat promo ini di Instagram">'
      +'    <img src="'+escape(p.cover||'')+'" alt="'+escape(p.cover_alt||p.title)+'" loading="lazy" decoding="async" />'
      +'  </a>'
      +'  <div class="body">'
      +'    <h3>'+escape(p.title)+'</h3>'
      +    price
      +    (items?'<ul>'+items+'</ul>':'')
      +    (tags?'<div class="tags">'+tags+'</div>':'')
      +    '<div class="meta-row">'+(range||'<small>—</small>')+'<a href="'+escape(p.instagram_url||'#')+'" target="_blank" rel="noopener noreferrer">Lihat di Instagram ↗</a></div>'
      +'  </div>'
      +'</article>';
  }
  fetch('assets/promos/promos.json',{cache:'no-store'})
    .then(function(r){if(!r.ok) throw new Error('HTTP '+r.status);return r.json();})
    .then(function(data){
      var active=(data.items||[]).filter(function(p){
        var fromOk=!p.valid_from||p.valid_from<=today;
        var untilOk=!p.valid_until||p.valid_until>=today;
        return fromOk&&untilOk;
      });
      if(!active.length){if(empty) empty.hidden=false;list.hidden=true;return;}
      list.innerHTML=active.map(card).join('');
      if(typeof reveal==='function'){list.querySelectorAll('.reveal').forEach(function(el){reveal.observe(el);});}
      else if(window.IntersectionObserver){
        new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');}});},{threshold:.15}).observe(list);
        list.querySelectorAll('.reveal').forEach(function(el){el.classList.add('visible');});
      }
    })
    .catch(function(){
      if(empty){empty.hidden=false;empty.textContent='Promo sedang dimuat… coba segarkan halaman.';}
      list.hidden=true;
    });
})();
