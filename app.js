(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const published = sanitizeData(window.STUDY_ARCHIVE_DATA || { subjects: [], entries: [] });
  const STORE_KEY = 'notespace-draft-v1';
  const THEME_KEY = 'notespace-theme-v1';
  let data = readDraft() || clone(published);
  let view = 'all';
  let subjectFilter = 'all';
  let typeFilter = 'all';
  let query = '';
  let sort = 'newest';
  let editMode = false;
  let currentId = null;
  let editingId = null;
  let toastTimer;
  const icons = ['∑','⚛','◇','⌘','✎','✳','◈','▧'];
  const palette = ['#6F5CE8','#3F8BDA','#E7954B','#3CA68B','#B16CD5','#D47189','#68869F'];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function safeText(value, max = 30000) { return String(value == null ? '' : value).slice(0, max); }
  function escapeHtml(value) { return safeText(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]); }
  function validColor(value) { return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#7B8799'; }
  function sanitizeData(source) {
    const input = source && typeof source === 'object' ? source : {};
    const subjects = Array.isArray(input.subjects) ? input.subjects.slice(0, 80).filter(s => s && s.id && s.name).map(s => ({ id: safeText(s.id,80), name: safeText(s.name,40), color: validColor(s.color), icon: safeText(s.icon || '▧',3) })) : [];
    if (!subjects.some(s => s.id === 'other')) subjects.push({id:'other',name:'기타',color:'#7B8799',icon:'▧'});
    const ids = new Set(subjects.map(s => s.id));
    const entries = Array.isArray(input.entries) ? input.entries.slice(0, 3000).filter(e => e && e.id && e.title).map(e => ({ id: safeText(e.id,90), type: e.type === 'problem' ? 'problem' : 'note', subject: ids.has(e.subject) ? e.subject : 'other', title: safeText(e.title,140), summary: safeText(e.summary,240), tags: Array.isArray(e.tags) ? e.tags.slice(0,20).map(t=>safeText(t,45)) : [], date: /^\d{4}-\d{2}-\d{2}$/.test(e.date || '') ? e.date : new Date().toISOString().slice(0,10), favorite: e.favorite === true, content: safeText(e.content,100000), solution: safeText(e.solution,100000) })) : [];
    return {subjects, entries};
  }
  function readDraft() { try { const v = localStorage.getItem(STORE_KEY); return v ? sanitizeData(JSON.parse(v)) : null; } catch { return null; } }
  function saveDraft() { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { toast('브라우저에 저장할 수 없습니다. 파일로 내보내기를 사용하세요.'); } renderAll(); }
  function toast(message) { const t = $('toast'); t.textContent = message; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3400); }
  function getSubject(id) { return data.subjects.find(s => s.id === id) || data.subjects.find(s => s.id === 'other'); }
  function subjectStyle(s) { return `--subject-color:${validColor(s?.color)};--subject-bg:${validColor(s?.color)}18`; }
  function dateFmt(date) { const pieces = safeText(date).split('-'); return pieces.length === 3 ? `${pieces[0]}.${pieces[1]}.${pieces[2]}` : escapeHtml(date); }
  function getEntry(id) { return data.entries.find(e => e.id === id); }
  function setNavHighlight() {
    document.querySelectorAll('.nav-link').forEach(btn => {
      const active = btn.dataset.view ? (subjectFilter === 'all' && btn.dataset.view === view) : btn.dataset.subject === subjectFilter;
      btn.classList.toggle('selected', active);
    });
  }
  function renderNav() {
    $('navAllCount').textContent = data.entries.length;
    $('subjectList').innerHTML = data.subjects.map(s => `<button class="nav-link" data-subject="${escapeHtml(s.id)}" style="${subjectStyle(s)}"><span class="subject-dot">${escapeHtml(s.icon)}</span> ${escapeHtml(s.name)} <span class="subject-count">${data.entries.filter(e=>e.subject===s.id).length}</span></button>`).join('');
    const options = `<option value="all">전체 과목</option>` + data.subjects.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('');
    $('subjectFilter').innerHTML = options;
    $('subjectFilter').value = data.subjects.some(s => s.id === subjectFilter) ? subjectFilter : 'all';
    $('entrySubject').innerHTML = data.subjects.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('');
    setNavHighlight();
  }
  function filteredEntries() {
    const term = query.trim().toLocaleLowerCase();
    let entries = data.entries.filter(e => {
      if (subjectFilter !== 'all' && e.subject !== subjectFilter) return false;
      if (view === 'notes' && e.type !== 'note') return false;
      if (view === 'problems' && e.type !== 'problem') return false;
      if (view === 'favorites' && !e.favorite) return false;
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (term && ![e.title,e.summary,e.content,e.solution,e.tags.join(' '),getSubject(e.subject)?.name||''].join(' ').toLocaleLowerCase().includes(term)) return false;
      return true;
    });
    entries.sort((a,b) => sort === 'oldest' ? a.date.localeCompare(b.date) : sort === 'title' ? a.title.localeCompare(b.title,'ko') : b.date.localeCompare(a.date));
    return entries;
  }
  function renderStats() {
    $('statNotes').textContent = data.entries.filter(e => e.type === 'note').length;
    $('statProblems').textContent = data.entries.filter(e => e.type === 'problem').length;
    $('statSubjects').textContent = data.subjects.filter(s => s.id !== 'other' || data.entries.some(e => e.subject === 'other')).length;
  }
  function renderCards() {
    const choices = filteredEntries();
    const viewNames = {all:'모든 학습 자료',notes:'수업 필기',problems:'문제 풀이',favorites:'즐겨찾기'};
    const name = subjectFilter === 'all' ? viewNames[view] : `${getSubject(subjectFilter)?.name || '과목'} 자료`;
    $('sectionTitle').innerHTML = `${escapeHtml(name)} <span id="itemCount" class="count-pill">${choices.length}</span>`;
    $('breadcrumbCurrent').textContent = name;
    $('sectionDescription').textContent = view === 'favorites' ? '나중에 다시 볼 중요한 내용을 모았어요.' : '지금까지 정리한 필기와 문제풀이를 둘러보세요.';
    $('cardsGrid').innerHTML = choices.map(e => {
      const sub = getSubject(e.subject);
      return `<article class="note-card" data-entry="${escapeHtml(e.id)}" tabindex="0" role="button" aria-label="${escapeHtml(e.title)} 열기" style="${subjectStyle(sub)}"><div class="card-top"><span class="card-subject"><span class="card-subject-symbol">${escapeHtml(sub.icon)}</span>${escapeHtml(sub.name)}</span><span class="card-type">${e.type==='note'?'수업 필기':'문제 풀이'}</span></div><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml(e.summary || '정리한 학습 자료를 확인해 보세요.')}</p><div class="card-tags">${e.tags.slice(0,3).map(t=>`<span class="tag">#${escapeHtml(t)}</span>`).join('')}${e.id.startsWith('demo-') ? '<span class="tag">예시 자료</span>' : ''}</div><div class="card-bottom"><span class="card-date">${dateFmt(e.date)}</span><span class="card-bottom-right"><button class="favorite-btn ${e.favorite?'is-favorite':''}" data-favorite="${escapeHtml(e.id)}" aria-label="즐겨찾기 ${e.favorite?'해제':'추가'}" title="즐겨찾기">${e.favorite?'★':'☆'}</button><span class="card-arrow">↗</span></span></div></article>`;
    }).join('');
    $('emptyState').classList.toggle('hidden', choices.length !== 0);
    $('cardsGrid').classList.toggle('hidden', choices.length === 0);
    document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.type===typeFilter));
  }
  function renderSubjectsManager() {
    $('manageSubjectList').innerHTML = data.subjects.map(s => `<div class="manage-subject-row" style="${subjectStyle(s)}"><span class="subject-dot">${escapeHtml(s.icon)}</span><span class="label">${escapeHtml(s.name)}</span><span class="subject-count">${data.entries.filter(e=>e.subject===s.id).length}개</span>${s.id !== 'other' ? `<button data-remove-subject="${escapeHtml(s.id)}">삭제</button>` : ''}</div>`).join('');
  }
  function renderAll() { renderStats(); renderNav(); renderCards(); renderSubjectsManager(); }
  function setView(newView, newSubject='all') {
    view = newView; subjectFilter = newSubject; typeFilter = 'all';
    $('subjectFilter').value = newSubject;
    closeMobile(); renderCards(); setNavHighlight();
    document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.type===typeFilter));
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function markdownToHtml(text) {
    const input = safeText(text,100000);
    try {
      if (window.marked && window.DOMPurify) {
        const raw = window.marked.parse(input, {breaks:true, gfm:true});
        return window.DOMPurify.sanitize(raw, {USE_PROFILES:{html:true}});
      }
    } catch (e) { console.warn('Markdown parsing failed',e); }
    return escapeHtml(input).replace(/\n/g,'<br>');
  }
  function enhanceMarkdown(el) {
    el.querySelectorAll('a[href]').forEach(a => { a.target='_blank'; a.rel='noopener noreferrer'; });
    try { if (window.renderMathInElement) window.renderMathInElement(el, {delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}],throwOnError:false}); } catch(e) { console.warn('Math parsing failed',e); }
  }
  function setHash(id) { const base = window.location.pathname+window.location.search; history.replaceState(null,'',base+'#note='+encodeURIComponent(id)); }
  function clearHash() { if (location.hash.startsWith('#note=')) history.replaceState(null,'',location.pathname+location.search+'#home'); }
  function openRead(id, updateHash=true) {
    const e = getEntry(id);
    if (!e) { if (!updateHash) toast('해당 자료를 찾을 수 없습니다.'); return; }
    currentId = id;
    const sub = getSubject(e.subject);
    $('readMeta').innerHTML = `<span style="color:${validColor(sub.color)};font-weight:800">${escapeHtml(sub.icon)} ${escapeHtml(sub.name)}</span><span>·</span><span>${e.type==='note'?'수업 필기':'문제 풀이'}</span><span>·</span><span>${dateFmt(e.date)}</span>`;
    $('readTitle').textContent = e.title;
    $('readSummary').textContent = e.summary;
    $('readTags').innerHTML = e.tags.map(t=>`<span class="tag">#${escapeHtml(t)}</span>`).join('');
    $('readContent').innerHTML = markdownToHtml(e.content || '작성된 본문이 없습니다.');
    enhanceMarkdown($('readContent'));
    const hasSolution = e.type === 'problem' && e.solution.trim();
    $('solutionSection').classList.toggle('hidden',!hasSolution);
    $('readSolution').innerHTML = markdownToHtml(e.solution);
    enhanceMarkdown($('readSolution'));
    $('readSolution').classList.add('hidden');
    $('solutionToggle').innerHTML = '해설 보기 <span>⌄</span>';
    $('favoriteReadBtn').textContent=e.favorite?'★':'☆';
    $('favoriteReadBtn').classList.toggle('is-favorite',e.favorite);
    $('editCurrentBtn').classList.toggle('hidden',!editMode);
    $('readOverlay').classList.remove('hidden');
    $('readOverlay').querySelector('.read-scroll').scrollTop=0;
    document.body.style.overflow='hidden';
    if (updateHash) setHash(id);
    $('closeReadBtn').focus();
  }
  function closeRead(clear=true) {
    $('readOverlay').classList.add('hidden'); currentId=null;
    if (clear) clearHash();
    if ($('editorOverlay').classList.contains('hidden') && $('managerOverlay').classList.contains('hidden')) document.body.style.overflow='';
  }
  function toggleFavorite(id) {
    const e=getEntry(id); if (!e) return;
    e.favorite=!e.favorite;
    saveDraft();
    if (currentId===id) {
      $('favoriteReadBtn').textContent=e.favorite?'★':'☆';
      $('favoriteReadBtn').classList.toggle('is-favorite',e.favorite);
    }
    toast(e.favorite?'즐겨찾기에 추가했어요.':'즐겨찾기를 해제했어요.');
  }
  function toggleEditorType() { $('solutionEditorLabel').classList.toggle('hidden', $('entryType').value !== 'problem'); }
  function openEditor(id=null) {
    editMode=true;
    $('editModeLabel').textContent='편집 · 게시 관리';
    editingId=id;
    const e=id ? getEntry(id) : null;
    $('entryForm').reset();
    $('entryType').value=e?.type||'note';
    $('entrySubject').value=e?.subject||(subjectFilter!=='all'?subjectFilter:data.subjects[0]?.id||'other');
    $('entryTitle').value=e?.title||'';
    $('entrySummary').value=e?.summary||'';
    $('entryTags').value=e?.tags.join(', ')||'';
    $('entryContent').value=e?.content||'';
    $('entrySolution').value=e?.solution||'';
    $('editorTitle').textContent=e?'학습 자료 수정':'새 학습 자료';
    $('deleteEntryBtn').classList.toggle('hidden',!e);
    toggleEditorType();
    const oldPreview=$('editorPreview'); if(oldPreview) oldPreview.remove();
    $('previewEntryBtn').textContent='미리보기';
    $('readOverlay').classList.add('hidden');
    $('editorOverlay').classList.remove('hidden');
    document.body.style.overflow='hidden';
    $('entryTitle').focus();
  }
  function closeEditor() {
    $('editorOverlay').classList.add('hidden');
    editingId=null;
    document.body.style.overflow='';
    clearHash();
  }
  function saveEditor(e) {
    e.preventDefault();
    const entry = {
      id: editingId || `entry-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      type: $('entryType').value === 'problem' ? 'problem' : 'note',
      subject: $('entrySubject').value,
      title: $('entryTitle').value.trim(),
      summary: $('entrySummary').value.trim(),
      tags: $('entryTags').value.split(',').map(x => x.trim().replace(/^#/,'')).filter(Boolean).slice(0,20),
      content: $('entryContent').value,
      solution: $('entryType').value === 'problem' ? $('entrySolution').value : '',
      date: editingId ? getEntry(editingId)?.date || new Date().toISOString().slice(0,10) : localDate(),
      favorite: editingId ? !!getEntry(editingId)?.favorite : false,
    };
    if (!entry.title) { toast('제목을 입력해 주세요.'); return; }
    if (editingId) { const i=data.entries.findIndex(x=>x.id===editingId); if(i>=0) data.entries[i]=entry; }
    else data.entries.unshift(entry);
    closeEditor(); saveDraft(); openRead(entry.id); toast('브라우저에 저장했어요. 공개하려면 data.js를 게시하세요.');
  }
  function localDate() { const now=new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; }
  function togglePreview() {
    const existing=$('editorPreview');
    if (existing) { existing.remove(); $('previewEntryBtn').textContent='미리보기'; return; }
    const preview=document.createElement('div');
    preview.id='editorPreview'; preview.className='editor-preview markdown-body';
    preview.innerHTML=`<h3>본문 미리보기</h3>${markdownToHtml($('entryContent').value)}${$('entryType').value==='problem'&&$('entrySolution').value ? '<hr><h3>해설 미리보기</h3>'+markdownToHtml($('entrySolution').value) : ''}`;
    $('entryForm').querySelector('.editor-footer').before(preview); enhanceMarkdown(preview);
    $('previewEntryBtn').textContent='미리보기 닫기';
    preview.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function openManager() {
    editMode=true;
    $('editModeLabel').textContent='편집 · 게시 관리';
    renderSubjectsManager();
    $('managerOverlay').classList.remove('hidden');
    document.body.style.overflow='hidden';
    closeMobile();
  }
  function closeManager() { $('managerOverlay').classList.add('hidden'); document.body.style.overflow=''; }
  function downloadData() {
    const content='/* notespace 공개 자료: 사이트에 게시하려면 이 파일로 기존 data.js를 교체하세요. */\nwindow.STUDY_ARCHIVE_DATA = '+JSON.stringify(data,null,2)+';\n';
    const blob=new Blob([content],{type:'text/javascript;charset=utf-8'});
    const url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;link.download='data.js';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('data.js 파일을 저장했어요. GitHub에 올리면 모두가 볼 수 있어요.');
  }
  async function importData(file) {
    if (!file) return;
    try {
      const raw=await file.text();
      let input;
      if (file.name.toLowerCase().endsWith('.json')) input=JSON.parse(raw);
      else {
        const match=raw.match(/(?:window\.)?STUDY_ARCHIVE_DATA\s*=\s*([\s\S]*?)\s*;?\s*$/);
        if (!match) throw Error('data.js 형식이 아닙니다.');
        input=JSON.parse(match[1].trim().replace(/;\s*$/,''));
      }
      if (!input || !Array.isArray(input.subjects) || !Array.isArray(input.entries)) throw Error('subjects와 entries가 필요합니다.');
      if (!confirm('현재 브라우저의 수정 내용을 가져온 파일로 바꾸시겠습니까?')) return;
      data=sanitizeData(input); saveDraft(); toast('자료를 불러왔어요.');
    } catch(e) { toast('파일을 불러오지 못했어요: '+e.message); }
    $('importFile').value='';
  }
  function resetData() {
    if(!confirm('이 브라우저에서 작성하거나 수정한 내용을 모두 버리고 공개본으로 되돌릴까요?'))return;
    data=clone(published);
    try { localStorage.removeItem(STORE_KEY); } catch {}
    renderAll();toast('현재 게시된 공개본으로 되돌렸어요.');
  }
  function addSubject(e) {
    e.preventDefault(); const name=$('newSubjectName').value.trim();
    if(!name) return;
    if(data.subjects.some(s=>s.name===name)){toast('이미 있는 과목입니다.');return;}
    const i=data.subjects.length;
    data.subjects.splice(Math.max(0,i-1),0,{id:`subject-${Date.now()}`,name,color:palette[i%palette.length],icon:icons[i%icons.length]});
    $('newSubjectName').value='';saveDraft();toast('새 과목을 추가했어요.');
  }
  function removeSubject(id) {
    const s=getSubject(id);if(!s || id==='other')return;
    if(!confirm(`'${s.name}' 과목을 삭제할까요? 기존 글은 '기타' 과목으로 이동합니다.`))return;
    data.entries.forEach(e=>{if(e.subject===id)e.subject='other';});
    data.subjects=data.subjects.filter(s=>s.id!==id);
    if(subjectFilter===id)subjectFilter='all';
    saveDraft();toast('과목을 삭제했어요.');
  }
  function copyLink(id) {
    if (!/^https?:$/.test(location.protocol)) { toast('사이트를 GitHub Pages에 공개한 후 링크를 복사할 수 있습니다.'); return; }
    const url=new URL(location.href);url.hash=id?'note='+encodeURIComponent(id):'home';
    if(navigator.clipboard?.writeText) navigator.clipboard.writeText(url.href).then(()=>toast('링크를 복사했어요.'),()=>fallbackCopy(url.href));
    else fallbackCopy(url.href);
  }
  function fallbackCopy(s) {
    const ta=document.createElement('textarea');ta.value=s;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
    try { document.execCommand('copy');toast('링크를 복사했어요.');}catch{toast('브라우저에서 주소를 직접 복사해 주세요.');}ta.remove();
  }
  function closeMobile(){$('sidebar').classList.remove('mobile-open');$('sidebarBackdrop').classList.remove('visible');}
  function restoreFromHash() {
    if(location.hash.startsWith('#note=')){
      const id=decodeURIComponent(location.hash.slice(6));
      if(getEntry(id))openRead(id,false);
    } else if(!$('readOverlay').classList.contains('hidden'))closeRead(false);
  }

  document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.view)));
  $('subjectList').addEventListener('click',e=>{const button=e.target.closest('[data-subject]');if(button)setView('all',button.dataset.subject);});
  $('cardsGrid').addEventListener('click',e=>{const fav=e.target.closest('[data-favorite]');if(fav){e.stopPropagation();toggleFavorite(fav.dataset.favorite);return;}const card=e.target.closest('[data-entry]');if(card)openRead(card.dataset.entry);});
  $('cardsGrid').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-entry]')){e.preventDefault();openRead(e.target.dataset.entry);}});
  $('searchInput').addEventListener('input',e=>{query=e.target.value;renderCards();});
  $('subjectFilter').addEventListener('change',e=>{subjectFilter=e.target.value;view='all';renderCards();setNavHighlight();});
  $('sortSelect').addEventListener('change',e=>{sort=e.target.value;renderCards();});
  $('categoryChips').addEventListener('click',e=>{const btn=e.target.closest('[data-type]');if(!btn)return;typeFilter=btn.dataset.type;renderCards();});
  ['newItemBtn','heroNewBtn','emptyNewBtn'].forEach(id=>$(id).addEventListener('click',()=>openEditor()));
  ['editModeBtn','manageSubjectsBtn','addSubjectBtn'].forEach(id=>$(id).addEventListener('click',openManager));
  ['closeManagerBtn'].forEach(id=>$(id).addEventListener('click',closeManager));
  $('closeReadBtn').addEventListener('click',()=>closeRead());
  $('bottomBackBtn').addEventListener('click',()=>closeRead());
  $('closeEditorBtn').addEventListener('click',closeEditor);
  $('entryType').addEventListener('change',toggleEditorType);
  $('entryForm').addEventListener('submit',saveEditor);
  $('previewEntryBtn').addEventListener('click',togglePreview);
  $('editCurrentBtn').addEventListener('click',()=>{const id=currentId;openEditor(id);});
  $('deleteEntryBtn').addEventListener('click',()=>{const entry=getEntry(editingId);if(!entry)return;if(confirm(`'${entry.title}' 자료를 삭제할까요?`)){data.entries=data.entries.filter(e=>e.id!==editingId);closeEditor();saveDraft();toast('자료를 삭제했어요.');}});
  $('favoriteReadBtn').addEventListener('click',()=>currentId&&toggleFavorite(currentId));
  $('solutionToggle').addEventListener('click',()=>{const body=$('readSolution');const isHidden=body.classList.toggle('hidden');$('solutionToggle').innerHTML=isHidden?'해설 보기 <span>⌄</span>':'해설 접기 <span>⌃</span>';});
  $('copyNoteBtn').addEventListener('click',()=>copyLink(currentId));
  $('copySiteLink').addEventListener('click',()=>copyLink(null));
  $('printBtn').addEventListener('click',()=>{if($('readSolution').innerHTML) $('readSolution').classList.remove('hidden');window.print();});
  $('exportBtn').addEventListener('click',downloadData);
  $('importBtn').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',e=>importData(e.target.files[0]));
  $('resetBtn').addEventListener('click',resetData);
  $('addSubjectForm').addEventListener('submit',addSubject);
  $('manageSubjectList').addEventListener('click',e=>{const btn=e.target.closest('[data-remove-subject]');if(btn)removeSubject(btn.dataset.removeSubject);});
  [['readOverlay',closeRead],['editorOverlay',closeEditor],['managerOverlay',closeManager]].forEach(([id,fn])=>$(id).addEventListener('click',e=>{if(e.target===$(id))fn();}));
  $('menuButton').addEventListener('click',()=>{$('sidebar').classList.add('mobile-open');$('sidebarBackdrop').classList.add('visible');});
  $('sidebarBackdrop').addEventListener('click',closeMobile);
  $('themeButton').addEventListener('click',()=>{const dark=document.body.classList.toggle('dark');$('themeButton').textContent=dark?'☀':'☾';try{localStorage.setItem(THEME_KEY,dark?'dark':'light');}catch{}});
  document.addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'');if(e.key==='Escape') {if(!$('editorOverlay').classList.contains('hidden'))closeEditor();else if(!$('managerOverlay').classList.contains('hidden'))closeManager();else if(!$('readOverlay').classList.contains('hidden'))closeRead();else closeMobile();} if((e.key==='/'&&!typing)||(e.ctrlKey&&e.key.toLowerCase()==='k')){e.preventDefault();if($('readOverlay').classList.contains('hidden')&&$('editorOverlay').classList.contains('hidden')&&$('managerOverlay').classList.contains('hidden'))$('searchInput').focus();}});
  window.addEventListener('hashchange',restoreFromHash);
  try{if(localStorage.getItem(THEME_KEY)==='dark'){document.body.classList.add('dark');$('themeButton').textContent='☀';}}catch{}
  renderAll();restoreFromHash();
})();
