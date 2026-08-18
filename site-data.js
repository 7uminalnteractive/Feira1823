// site-data.js — SC Feira 1823
// Busca conteúdo do Supabase e renderiza nos containers de cada página pública.
// Cada página só precisa ter os containers com os IDs certos (ver comentários abaixo)
// e incluir este script + supabase-client.js.

(function(){
  const sb = getSupabaseClient();

  function escapeHtml(str){
    if(str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function formatDate(dateStr){
    if(!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const dia = String(d.getDate()).padStart(2,'0');
    const mes = String(d.getMonth()+1).padStart(2,'0');
    return dias[d.getDay()] + ', ' + dia + '/' + mes;
  }

  // ---------------- Logo (para escudos) ----------------
  let LOGO_SRC = null;
  function getLogoSrc(){
    if(LOGO_SRC) return LOGO_SRC;
    const navLogo = document.querySelector('.brand img');
    LOGO_SRC = navLogo ? navLogo.getAttribute('src') : '';
    return LOGO_SRC;
  }

  function badgeHtml(isUs, initials){
    if(isUs){
      return '<div class="badge"><img src="' + getLogoSrc() + '" alt=""></div>';
    }
    return '<div class="badge"><span class="badge-opponent">' + escapeHtml(initials) + '</span></div>';
  }

  function initialsOf(name){
    if(!name) return '?';
    const parts = name.trim().split(/\s+/);
    if(parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  }

  // ---------------- Próximo jogo (matchstrip, em todas as páginas) ----------------
  async function renderMatchstrip(){
    const el = document.getElementById('matchstrip-content');
    if(!el) return;
    const res = await sb.from('matches').select('*').eq('status', 'scheduled').order('sort_order').limit(1);
    if(res.error || !res.data.length){
      el.innerHTML = '<div class="ms-label">Próximo jogo em breve</div>';
      return;
    }
    const m = res.data[0];
    const matchup = m.is_home ? ('SC Feira 1823 x ' + escapeHtml(m.opponent)) : (escapeHtml(m.opponent) + ' x SC Feira 1823');
    const dateBit = m.match_date ? formatDate(m.match_date) : (m.round_label || '');
    el.innerHTML =
      '<div class="ms-label"><span class="dot"></span> Próximo jogo</div>' +
      '<div class="ms-line"><strong>' + matchup + '</strong>' +
      (dateBit ? ' <span class="ms-sep">·</span> <strong>' + escapeHtml(dateBit) + '</strong>' : '') +
      (m.match_time ? ', ' + escapeHtml(m.match_time) : '') +
      (m.location ? ' <span class="ms-sep">·</span> ' + escapeHtml(m.location) : '') +
      '</div>';
  }

  // ---------------- Cards de jogos (home + resultados) ----------------
  function matchCardHtml(m){
    const tagCls = m.status === 'live' ? 'tag-live' : 'tag-ft';
    const tagLabel = m.status === 'scheduled' ? 'Próximo' : (m.status === 'live' ? 'Ao vivo' : 'Encerrado');
    const homeBadge = m.is_home ? badgeHtml(true) : badgeHtml(false, initialsOf(m.opponent));
    const awayBadge = m.is_home ? badgeHtml(false, initialsOf(m.opponent)) : badgeHtml(true);
    const homeName = m.is_home ? 'SC Feira' : escapeHtml(m.opponent);
    const awayName = m.is_home ? escapeHtml(m.opponent) : 'SC Feira';
    let middle;
    if(m.our_score !== null && m.opponent_score !== null){
      const homeScore = m.is_home ? m.our_score : m.opponent_score;
      const awayScore = m.is_home ? m.opponent_score : m.our_score;
      middle = '<div class="match-result">' + homeScore + '–' + awayScore + '</div>';
    } else {
      middle = '<div class="match-vs">VS</div>';
    }
    const dateHtml = (m.match_date || m.match_time)
      ? '<div class="match-date">' + (m.match_date ? formatDate(m.match_date) : '') + (m.match_time ? ' · ' + escapeHtml(m.match_time) : '') + '</div>'
      : '';
    const compLabel = escapeHtml(m.competition) + (m.round_label ? ' · ' + escapeHtml(m.round_label) : '');
    return '<div class="match-card">' +
      '<span class="' + tagCls + '">' + tagLabel + '</span>' +
      '<div class="comp">' + compLabel + '</div>' +
      '<div class="match-teams">' +
        '<div class="match-team">' + homeBadge + '<span>' + homeName + '</span></div>' +
        middle +
        '<div class="match-team">' + awayBadge + '<span>' + awayName + '</span></div>' +
      '</div>' +
      dateHtml +
      '<div class="match-place">' + escapeHtml(m.location || '') + '</div>' +
    '</div>';
  }

  async function renderMatches(limit){
    const el = document.getElementById('matches-row');
    if(!el) return;
    let query = sb.from('matches').select('*').order('sort_order');
    if(limit) query = query.limit(limit);
    const res = await query;
    if(res.error || !res.data.length){
      el.innerHTML = '<p style="color:var(--gray); padding:20px;">Nenhum jogo cadastrado no momento.</p>';
      return;
    }
    el.innerHTML = res.data.map(matchCardHtml).join('');
  }

  // ---------------- Tabela de classificação ----------------
  async function renderStandings(){
    const el = document.getElementById('standings-table');
    if(!el) return;
    const res = await sb.from('standings').select('*').order('position');
    if(res.error || !res.data.length){
      el.innerHTML = '<p style="color:var(--gray); padding:20px;">Classificação não disponível.</p>';
      return;
    }
    const rows = res.data.map(function(s){
      const teamCell = s.is_us
        ? '<img src="' + getLogoSrc() + '" alt="">' + escapeHtml(s.team_name)
        : escapeHtml(s.team_name);
      return '<tr class="' + (s.is_us ? 'us' : '') + '">' +
        '<td class="pos">' + s.position + '</td>' +
        '<td class="team">' + teamCell + '</td>' +
        '<td class="num">' + s.points + '</td>' +
        '<td class="num">' + s.played + '</td>' +
        '<td class="num">' + s.wins + '</td>' +
        '<td class="num">' + s.draws + '</td>' +
        '<td class="num">' + s.losses + '</td>' +
        '<td class="pts">' + s.points + '</td>' +
      '</tr>';
    }).join('');
    el.innerHTML = '<div class="standings-scroll"><table class="standings">' +
      '<thead><tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>PTS</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>';
  }

  // ---------------- Elenco ----------------
  const PLAYER_SILHOUETTE = '<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" class="silhouette"><g fill="currentColor"><circle cx="100" cy="42" r="26"/><path d="M100 72c-22 0-38 14-42 34l-8 60c-1 8 5 15 13 15h6l4 70c0 6 5 10 10 10h34c5 0 10-4 10-10l4-70h6c8 0 14-7 13-15l-8-60c-4-20-20-34-42-34z"/></g></svg>';

  async function renderPlayers(){
    const el = document.getElementById('squad-grid');
    if(!el) return;
    const res = await sb.from('players').select('*').order('sort_order');
    if(res.error || !res.data.length){
      el.innerHTML = '<p style="color:var(--gray); padding:20px;">Elenco em atualização.</p>';
      return;
    }
    el.innerHTML = res.data.map(function(p){
      return '<a class="squad-card squad-card-link" data-position="' + escapeHtml(p.position) + '" href="jogador.html?id=' + encodeURIComponent(p.id) + '">' +
        '<div class="squad-photo">' +
          '<span class="squad-num-big us-color">' + escapeHtml(p.number) + '</span>' +
          PLAYER_SILHOUETTE +
        '</div>' +
        '<div class="squad-info">' +
          '<div class="pos">' + escapeHtml(p.position) + '</div>' +
          '<div class="name">' + escapeHtml(p.name) + '</div>' +
          '<div class="num-tag">Nº ' + escapeHtml(p.number) + '</div>' +
        '</div>' +
      '</a>';
    }).join('');
    setupSquadTabs();
  }

  function setupSquadTabs(){
    const tabs = document.querySelectorAll('.squad-tab');
    if(!tabs.length) return;
    const filterMap = {
      'Todos': null,
      'Goleiros': ['GOL'],
      'Linha': ['FIXO','ALA','MEIA'],
      'Pivôs': ['PIVO']
    };
    tabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        tabs.forEach(function(t){ t.classList.remove('active'); });
        tab.classList.add('active');
        const positions = filterMap[tab.textContent.trim()];
        document.querySelectorAll('.squad-card').forEach(function(card){
          if(!positions || positions.indexOf(card.dataset.position) !== -1){
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // ---------------- Comissão técnica ----------------
  async function renderStaff(){
    const el = document.getElementById('staff-grid');
    if(!el) return;
    const res = await sb.from('staff').select('*').order('sort_order');
    if(res.error || !res.data.length){
      el.innerHTML = '<p style="color:var(--gray); padding:20px;">Comissão técnica em atualização.</p>';
      return;
    }
    el.innerHTML = res.data.map(function(s){
      return '<a class="staff-card" style="display:block;" href="tecnico.html?id=' + encodeURIComponent(s.id) + '"><div class="role">' + escapeHtml(s.role) + '</div><div class="name">' + escapeHtml(s.name) + '</div></a>';
    }).join('');
  }

  // ---------------- Notícias ----------------
  async function renderNewsHome(){
    const featuredEl = document.getElementById('news-feature');
    const sideEl = document.getElementById('news-side');
    if(!featuredEl && !sideEl) return;
    const res = await sb.from('news').select('*').order('sort_order');
    if(res.error || !res.data.length){
      if(featuredEl) featuredEl.innerHTML = '<div class="inner"><span class="cat">Notícias</span><h3>Em breve</h3></div>';
      return;
    }
    const featured = res.data.find(function(n){ return n.is_featured; }) || res.data[0];
    const rest = res.data.filter(function(n){ return n.id !== featured.id; }).slice(0,3);
    if(featuredEl){
      featuredEl.innerHTML = '<div class="inner">' +
        '<span class="cat">' + escapeHtml(featured.category) + '</span>' +
        '<h3>' + escapeHtml(featured.title) + '</h3>' +
        '<p>' + escapeHtml(featured.summary) + '</p>' +
      '</div>';
    }
    if(sideEl){
      sideEl.innerHTML = rest.map(function(n){
        return '<div class="news-item">' +
          '<span class="cat">' + escapeHtml(n.category) + '</span>' +
          '<h4>' + escapeHtml(n.title) + '</h4>' +
          '<span class="date">' + formatDate(n.published_at) + '</span>' +
        '</div>';
      }).join('');
    }
  }

  async function renderNewsFull(){
    const el = document.getElementById('news-grid-full');
    if(!el) return;
    const res = await sb.from('news').select('*').order('sort_order');
    if(res.error || !res.data.length){
      el.innerHTML = '<p style="color:var(--gray); padding:20px;">Nenhuma notícia publicada ainda.</p>';
      return;
    }
    el.innerHTML = res.data.map(function(n){
      return '<div class="news-card-full">' +
        '<span class="cat">' + escapeHtml(n.category) + '</span>' +
        '<h3>' + escapeHtml(n.title) + '</h3>' +
        '<p>' + escapeHtml(n.summary) + '</p>' +
        '<span class="date">' + formatDate(n.published_at) + '</span>' +
      '</div>';
    }).join('');
  }

  // ---------------- Quicklink "próximo jogo" da home ----------------
  async function renderHomeQuicklinkMatch(){
    const el = document.getElementById('ql-match');
    if(!el) return;
    const res = await sb.from('matches').select('*').eq('status', 'scheduled').order('sort_order').limit(1);
    if(res.error || !res.data.length){
      el.innerHTML = '<span class="ql-label">Próximo jogo</span><span class="ql-main">Em breve</span>';
      return;
    }
    const m = res.data[0];
    const opponent = escapeHtml(m.opponent);
    const dateBit = m.match_date ? formatDate(m.match_date) : (m.round_label || '');
    el.innerHTML =
      '<span class="ql-label">Próximo jogo</span>' +
      '<span class="ql-main">SC Feira 1823 <em>x</em> ' + opponent + '</span>' +
      '<span class="ql-sub">' + escapeHtml(dateBit) + (m.match_time ? ' · ' + escapeHtml(m.match_time) : '') + (m.location ? ' · ' + escapeHtml(m.location) : '') + '</span>';
  }

  async function renderHomeQuicklinkNews(){
    const el = document.getElementById('ql-news');
    if(!el) return;
    const res = await sb.from('news').select('*').order('sort_order').limit(1);
    if(res.error || !res.data.length) return;
    const n = res.data[0];
    el.innerHTML =
      '<span class="ql-label">' + escapeHtml(n.category) + '</span>' +
      '<span class="ql-main">' + escapeHtml(n.title) + '</span>' +
      '<span class="ql-sub">Ler notícia →</span>';
  }

  // ---------------- Página de perfil individual (jogador.html / tecnico.html) ----------------
  function getQueryParam(name){
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  const POSITION_LABELS = { GOL:'Goleiro', FIXO:'Fixo', ALA:'Ala', MEIA:'Meia', PIVO:'Pivô' };

  async function renderPlayerProfile(){
    const el = document.getElementById('profileContent');
    if(!el || !window.location.pathname.includes('jogador.html')) return;
    const id = getQueryParam('id');
    if(!id){
      el.innerHTML = notFoundHtml('Jogador não encontrado', 'Nenhum jogador foi especificado.');
      return;
    }
    const res = await sb.from('players').select('*').eq('id', id).single();
    if(res.error || !res.data){
      el.innerHTML = notFoundHtml('Jogador não encontrado', 'O jogador que você procura não existe ou foi removido.');
      return;
    }
    const p = res.data;
    document.title = p.name + ' — Sport Club Feira 1823 SAF';
    const photoInner = p.photo_url
      ? '<img src="' + escapeHtml(p.photo_url) + '" alt="' + escapeHtml(p.name) + '">'
      : '<span class="profile-num">' + escapeHtml(p.number) + '</span>' + PLAYER_SILHOUETTE;

    const metaItems = [];
    metaItems.push(metaItem('Número', '#' + escapeHtml(p.number)));
    metaItems.push(metaItem('Posição', POSITION_LABELS[p.position] || escapeHtml(p.position)));
    if(p.nationality) metaItems.push(metaItem('Nacionalidade', escapeHtml(p.nationality)));
    if(p.height_cm) metaItems.push(metaItem('Altura', p.height_cm + ' cm'));
    if(p.joined_at) metaItems.push(metaItem('No clube desde', formatDate(p.joined_at)));

    el.innerHTML =
      '<header class="profile-hero"><div class="wrap">' +
        '<div class="profile-photo">' + photoInner + '</div>' +
        '<div class="profile-info">' +
          '<span class="pos-chip">' + (POSITION_LABELS[p.position] || escapeHtml(p.position)) + '</span>' +
          '<h1>' + escapeHtml(p.name) + '</h1>' +
          '<div class="role-line">Sport Club Feira 1823 · Elenco principal</div>' +
          '<div class="profile-meta-row">' + metaItems.join('') + '</div>' +
        '</div>' +
      '</div></header>' +
      '<section class="profile-body"><div class="wrap">' +
        (p.bio
          ? '<p class="profile-bio">' + escapeHtml(p.bio) + '</p>'
          : '<p class="profile-bio empty">Biografia ainda não cadastrada.</p>') +
      '</div></section>';
  }

  async function renderStaffProfile(){
    const el = document.getElementById('profileContent');
    if(!el || !window.location.pathname.includes('tecnico.html')) return;
    const id = getQueryParam('id');
    if(!id){
      el.innerHTML = notFoundHtml('Membro não encontrado', 'Nenhum membro da comissão foi especificado.');
      return;
    }
    const res = await sb.from('staff').select('*').eq('id', id).single();
    if(res.error || !res.data){
      el.innerHTML = notFoundHtml('Membro não encontrado', 'Este integrante da comissão técnica não existe ou foi removido.');
      return;
    }
    const s = res.data;
    document.title = s.name + ' — Sport Club Feira 1823 SAF';
    const photoInner = s.photo_url
      ? '<img src="' + escapeHtml(s.photo_url) + '" alt="' + escapeHtml(s.name) + '">'
      : PLAYER_SILHOUETTE;

    const metaItems = [];
    metaItems.push(metaItem('Cargo', escapeHtml(s.role)));
    if(s.joined_at) metaItems.push(metaItem('No clube desde', formatDate(s.joined_at)));

    el.innerHTML =
      '<header class="profile-hero"><div class="wrap">' +
        '<div class="profile-photo">' + photoInner + '</div>' +
        '<div class="profile-info">' +
          '<span class="pos-chip">' + escapeHtml(s.role) + '</span>' +
          '<h1>' + escapeHtml(s.name) + '</h1>' +
          '<div class="role-line">Sport Club Feira 1823 · Comissão Técnica</div>' +
          '<div class="profile-meta-row">' + metaItems.join('') + '</div>' +
        '</div>' +
      '</div></header>' +
      '<section class="profile-body"><div class="wrap">' +
        (s.bio
          ? '<p class="profile-bio">' + escapeHtml(s.bio) + '</p>'
          : '<p class="profile-bio empty">Biografia ainda não cadastrada.</p>') +
      '</div></section>';
  }

  function metaItem(label, value){
    return '<div class="profile-meta-item"><div class="label">' + label + '</div><div class="value">' + value + '</div></div>';
  }

  function notFoundHtml(title, sub){
    return '<div class="profile-notfound"><h2>' + title + '</h2><p>' + sub + '</p></div>';
  }

  // ---------------- Bootstrap: roda o que existir na página atual ----------------
  document.addEventListener('DOMContentLoaded', function(){
    renderMatchstrip();
    renderMatches();
    renderStandings();
    renderPlayers();
    renderStaff();
    renderNewsHome();
    renderNewsFull();
    renderHomeQuicklinkMatch();
    renderHomeQuicklinkNews();
    renderPlayerProfile();
    renderStaffProfile();
  });
})();
