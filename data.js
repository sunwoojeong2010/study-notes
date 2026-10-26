/* 공개되는 학습 자료. 관리 공간에서 내려받은 data.js로 교체하여 게시할 수 있습니다. */
window.STUDY_ARCHIVE_DATA = {
  "subjects": [
    { "id": "math", "name": "수학", "color": "#6F5CE8", "icon": "∑" },
    { "id": "physics", "name": "물리", "color": "#3F8BDA", "icon": "⚛" },
    { "id": "chemistry", "name": "화학", "color": "#E7954B", "icon": "◇" },
    { "id": "coding", "name": "프로그래밍", "color": "#3CA68B", "icon": "⌘" },
    { "id": "other", "name": "기타", "color": "#7B8799", "icon": "▧" }
  ],
  "entries": [
    {
      "id": "demo-math-linear", "type": "note", "subject": "math", "title": "행렬과 선형변환의 관계", "summary": "행렬이 벡터를 어떻게 변환하는지 핵심 성질과 예시를 통해 정리합니다.", "tags": ["선형대수", "행렬", "선형변환"], "date": "2026-10-24", "favorite": true,
      "content": "# 행렬과 선형변환\n\n선형변환 $T$는 다음 두 조건을 만족합니다.\n\n1. $T(\\mathbf{u}+\\mathbf{v})=T(\\mathbf{u})+T(\\mathbf{v})$\n2. $T(c\\mathbf{u})=cT(\\mathbf{u})$\n\n## 행렬 표현\n\n$T(\\mathbf{x})=A\\mathbf{x}$ 형태로 나타낼 수 있습니다.\n\n예를 들어, $A=\\begin{pmatrix}2&0\\\\0&3\\end{pmatrix}$은 $x$방향을 2배, $y$방향을 3배 늘립니다.\n\n> 이 글은 예시 자료입니다. 실제 필기로 자유롭게 교체하세요.", "solution": ""
    },
    {
      "id": "demo-physics-field", "type": "note", "subject": "physics", "title": "전기장과 전위의 핵심 정리", "summary": "전기장, 전위, 전위차의 관계와 기본 공식을 모아 봅니다.", "tags": ["전기장", "전위", "정전기학"], "date": "2026-10-22", "favorite": false,
      "content": "# 전기장과 전위\n\n## 전기장\n\n점전하 $Q$가 만드는 전기장의 크기:\n\n$$E=k\\frac{|Q|}{r^2}$$\n\n전기장의 방향은 양전하가 받는 힘의 방향으로 정의합니다.\n\n## 전위\n\n점전하의 전위는 다음과 같습니다.\n\n$$V=k\\frac{Q}{r}$$\n\n전위차와 전기장이 연결되는 관계는 $\\Delta V=-\\int \\mathbf{E}\\cdot d\\mathbf{l}$ 입니다.\n\n> 이 글은 예시 자료입니다.", "solution": ""
    },
    {
      "id": "demo-chem-hess", "type": "note", "subject": "chemistry", "title": "헤스의 법칙과 반응 엔탈피", "summary": "엔탈피는 상태함수이며, 반응 경로에 관계없이 전체 엔탈피 변화가 같습니다.", "tags": ["열화학", "헤스의 법칙", "엔탈피"], "date": "2026-10-18", "favorite": true,
      "content": "# 헤스의 법칙\n\n반응의 엔탈피 변화는 초기 상태와 최종 상태만으로 결정됩니다. 여러 반응 단계를 합하면 반응 엔탈피 역시 합해집니다.\n\n$$\\Delta H_{total}=\\sum_i \\Delta H_i$$\n\n## 실험 적용\n\n산화 칼슘의 수화 반응과 수산화 칼슘의 중화 반응을 적절히 더하면 직접 반응 경로의 엔탈피와 비교할 수 있습니다.\n\n> 이 글은 예시 자료입니다.", "solution": ""
    },
    {
      "id": "demo-problem-tiling", "type": "problem", "subject": "coding", "title": "2×N 타일링 — 점화식 찾기", "summary": "2×1 도미노로 2×N 판을 채우는 경우의 수를 구합니다.", "tags": ["동적 계획법", "점화식", "C언어"], "date": "2026-10-20", "favorite": false,
      "content": "# 문제\n\n$2\\times 1$ 도미노를 회전하여 사용해 $2\\times n$ 직사각형을 채우는 서로 다른 경우의 수를 구하세요.\n\n- 타일은 겹치지 않습니다.\n- 직사각형을 빈틈없이 채워야 합니다.\n\n$n=1,2,3,4$에서 경우의 수를 직접 세어 점화식을 찾아 보세요.",
      "solution": "## 핵심 아이디어\n\n마지막 부분은 세로 타일 1개를 놓거나 가로 타일 2개를 쌓는 두 경우뿐입니다. 따라서\n\n$$f(n)=f(n-1)+f(n-2)$$\n\n초깃값은 $f(1)=1$, $f(2)=2$입니다. 따라서 $f(3)=3$, $f(4)=5$가 됩니다."
    },
    {
      "id": "demo-problem-integral", "type": "problem", "subject": "math", "title": "적분으로 원주율 표현하기", "summary": "아크탄젠트 함수와 정적분을 이용하여 π/4가 나타나는 이유를 설명합니다.", "tags": ["정적분", "원주율", "역삼각함수"], "date": "2026-10-15", "favorite": false,
      "content": "# 문제\n\n다음 적분의 값을 구하고, 왜 원주율 $\\pi$가 등장하는지 설명해 보세요.\n\n$$\\int_0^1 \\frac{1}{1+x^2}\\,dx$$",
      "solution": "## 풀이\n\n$\\arctan x$를 미분하면 $\\frac{1}{1+x^2}$이므로,\n\n$$\\int_0^1\\frac{1}{1+x^2}\\,dx=[\\arctan x]_0^1=\\frac{\\pi}{4}$$\n\n$\\arctan(1)$이 $\\pi/4$인 이유는 직각삼각형에서 두 직각변의 길이가 같을 때 예각이 $45^\\circ$이기 때문입니다."
    },
    {
      "id": "demo-chem-question", "type": "problem", "subject": "chemistry", "title": "반응열로 헤스의 법칙 확인하기", "summary": "연속된 두 단계의 반응열을 합해 전체 반응열을 구하는 연습문제입니다.", "tags": ["열화학", "반응열", "기본문제"], "date": "2026-10-12", "favorite": false,
      "content": "# 문제\n\n가상의 반응 $A\\to B$의 엔탈피 변화가 $-25\\,\\mathrm{kJ}$, $B\\to C$의 엔탈피 변화가 $+10\\,\\mathrm{kJ}$입니다.\n\n이때 $A\\to C$의 엔탈피 변화를 구해 보세요.",
      "solution": "헤스의 법칙에 따라 두 단계 반응의 엔탈피 변화를 더합니다.\n\n$$\\Delta H=(-25)+(+10)=-15\\,\\mathrm{kJ}$$\n\n따라서 전체 반응의 엔탈피 변화는 $-15\\,\\mathrm{kJ}$입니다."
    }
  ]
};
