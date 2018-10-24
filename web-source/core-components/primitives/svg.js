import * as React from 'react';

export const ChevronRight = props => (
  <svg version="1.1" viewBox="0 0 24 24" {...props}>
    <path d="M8.59,16.34l4.58,-4.59l-4.58,-4.59l1.41,-1.41l6,6l-6,6Z" fill="currentColor" />
    <path fill="none" d="M0,-0.25h24v24h-24Z" />
  </svg>
);

export const ChevronLeft = props => (
  <svg version="1.1" viewBox="0 0 24 24" {...props}>
    <path d="M15.41,16.09l-4.58,-4.59l4.58,-4.59l-1.41,-1.41l-6,6l6,6Z" fill="currentColor" />
    <path fill="none" d="M0,-0.5h24v24h-24Z" />
  </svg>
);

export const SearchBarIcon = props => (
  <svg version="1.1" viewBox="0 0 24 24" {...props}>
    <path
      d="M15.5,14h-0.79l-0.28,-0.27c0.98,-1.14 1.57,-2.62 1.57,-4.23c0,-3.59 -2.91,-6.5 -6.5,-6.5c-3.59,0 -6.5,2.91 -6.5,6.5c0,3.59 2.91,6.5 6.5,6.5c1.61,0 3.09,-0.59 4.23,-1.57l0.27,0.28v0.79l5,4.99l1.49,-1.49l-4.99,-5Zm-6,0c-2.49,0 -4.5,-2.01 -4.5,-4.5c0,-2.49 2.01,-4.5 4.5,-4.5c2.49,0 4.5,2.01 4.5,4.5c0,2.49 -2.01,4.5 -4.5,4.5Z"
      fill="currentColor"
    />
    <path fill="none" d="M0,0h24v24h-24Z" />
  </svg>
);

export const MediaIcon = props => (
  <svg viewBox="0 0 24 24" {...props}>
    <g fill="currentColor">
      <path d="M24,4.75v0c0,-1.65685 -1.34315,-3 -3,-3h-18l-1.31134e-07,3.55271e-15c-1.65685,7.24234e-08 -3,1.34315 -3,3c0,0 0,1.77636e-15 0,1.77636e-15v14.5l3.19744e-14,4.52987e-07c2.50178e-07,1.65685 1.34315,3 3,3h18h-1.31134e-07c1.65685,7.24234e-08 3,-1.34315 3,-3Zm-14.346,-1l3.24426e-08,-5.88595e-08c0.257533,-0.467233 0.845072,-0.637228 1.3123,-0.379695c0.159905,0.0881379 0.291557,0.21979 0.379695,0.379695l-6.28436e-09,-9.75868e-09c0.0962064,0.149394 0.149482,0.322366 0.154,0.5l-1.69308e-08,6.65615e-07c-0.00451842,0.177634 -0.0577938,0.350606 -0.154,0.5l1.01735e-08,-1.84575e-08c-0.257533,0.467233 -0.845072,0.637228 -1.3123,0.379695c-0.159905,-0.0881379 -0.291557,-0.21979 -0.379695,-0.379695l-3.95811e-08,-6.14635e-08c-0.0962064,-0.149394 -0.149482,-0.322366 -0.154,-0.5l1.54652e-08,-6.08001e-07c0.00451841,-0.177634 0.0577939,-0.350606 0.154001,-0.5Zm-3.5,0l3.24426e-08,-5.88595e-08c0.257533,-0.467233 0.845072,-0.637228 1.3123,-0.379695c0.159905,0.0881379 0.291557,0.21979 0.379695,0.379695l-7.23141e-09,-1.12293e-08c0.0962064,0.149394 0.149482,0.322366 0.154,0.5l-1.69308e-08,6.65615e-07c-0.00451842,0.177634 -0.0577938,0.350606 -0.154,0.5l1.01735e-08,-1.84575e-08c-0.257533,0.467233 -0.845072,0.637228 -1.3123,0.379695c-0.159905,-0.0881379 -0.291557,-0.21979 -0.379695,-0.379695l-3.47903e-08,-5.40242e-08c-0.0962064,-0.149394 -0.149482,-0.322366 -0.154,-0.500001l1.22282e-08,-4.80737e-07c0.0045184,-0.177634 0.0577938,-0.350606 0.154,-0.5Zm-3.562,0.092l-3.29667e-08,7.37723e-08c0.160195,-0.358482 0.515357,-0.590042 0.908,-0.592l-1.62245e-08,-1.87104e-10c0.350938,0.00404708 0.673215,0.194518 0.846,0.5l-6.28436e-09,-9.75868e-09c0.0962064,0.149394 0.149482,0.322366 0.154,0.5l-1.69308e-08,6.65615e-07c-0.00451842,0.177634 -0.0577938,0.350606 -0.154,0.5l1.01735e-08,-1.84575e-08c-0.257533,0.467233 -0.845072,0.637228 -1.3123,0.379695c-0.159905,-0.0881379 -0.291557,-0.21979 -0.379695,-0.379695l-3.95811e-08,-6.14635e-08c-0.0962064,-0.149394 -0.149482,-0.322366 -0.154,-0.5l-4.62796e-09,7.10363e-07c0.000918809,-0.141039 0.0323016,-0.280215 0.0920002,-0.408Zm19.408,15.408v0c0,0.552285 -0.447715,1 -1,1h-18h-4.37114e-08c-0.552285,-2.41411e-08 -1,-0.447715 -1,-1c0,0 0,-3.55271e-15 0,-3.55271e-15v-12.25l3.55271e-15,3.77489e-08c-2.08482e-08,-0.138071 0.111929,-0.25 0.25,-0.25h19.5l-2.98122e-09,8.88178e-16c0.138071,-2.24947e-08 0.25,0.111929 0.25,0.25c3.55271e-15,1.27446e-08 3.55271e-15,2.50043e-08 3.55271e-15,3.77489e-08Z" />
      <path d="M3,16.5l-2.6428e-08,-3.36406e-05c0.000532882,0.690127 0.559839,1.24946 1.24997,1.25003h6l5.47252e-08,-4.2256e-11c0.690141,-0.000532923 1.24948,-0.55986 1.25003,-1.25v-6l2.7773e-08,1.74762e-05c-0.00109157,-0.689899 -0.560083,-1.24891 -1.24998,-1.25002h-6l2.85984e-08,-4.52491e-11c-0.689906,0.00109156 -1.24892,0.560094 -1.25002,1.25Zm1.5,-5.5l2.66454e-15,3.7749e-08c-2.08482e-08,-0.138071 0.111929,-0.25 0.25,-0.25h5h-2.98122e-09c0.138071,-2.24947e-08 0.25,0.111929 0.25,0.25c1.77636e-15,1.27446e-08 3.55271e-15,2.50043e-08 3.55271e-15,3.77489e-08v3.839l7.21257e-09,4.24283e-06c0.000233541,0.138071 -0.111506,0.250189 -0.249577,0.250423c-0.0884044,0.000149532 -0.170315,-0.0464016 -0.215425,-0.12243l-1.387,-2.322l7.1413e-09,1.19092e-08c-0.142013,-0.236827 -0.449123,-0.313689 -0.68595,-0.171677c-0.0499736,0.0299665 -0.0943244,0.0684377 -0.13105,0.113677l-2.387,2.941l-8.43222e-10,1.03744e-09c-0.0870854,0.107144 -0.244539,0.123404 -0.351683,0.0363188c-0.0582219,-0.0473222 -0.0921123,-0.118291 -0.092317,-0.193319Z" />
      <path d="M12.5,16.5l-2.6428e-08,-3.36406e-05c0.000532882,0.690127 0.559839,1.24946 1.24997,1.25003h6l5.47252e-08,-4.2256e-11c0.690141,-0.000532923 1.24948,-0.55986 1.25003,-1.25v-6l2.7773e-08,1.74762e-05c-0.00109157,-0.689899 -0.560083,-1.24891 -1.24998,-1.25002h-6l2.85984e-08,-4.52491e-11c-0.689906,0.00109156 -1.24892,0.560094 -1.25002,1.25Zm1.5,-5.5l3.55271e-15,3.7749e-08c-2.08482e-08,-0.138071 0.111929,-0.25 0.25,-0.25h5h-1.09278e-08c0.138071,-6.03528e-09 0.25,0.111929 0.25,0.25v3.839l7.21257e-09,4.24283e-06c0.000233541,0.138071 -0.111506,0.250189 -0.249577,0.250423c-0.0884044,0.000149532 -0.170315,-0.0464016 -0.215425,-0.12243l-1.387,-2.322l7.1413e-09,1.19092e-08c-0.142013,-0.236827 -0.449123,-0.313689 -0.68595,-0.171677c-0.0499736,0.0299665 -0.0943244,0.0684377 -0.13105,0.113677l-2.387,2.941l4.71387e-09,-5.79945e-09c-0.0870869,0.107143 -0.244541,0.123401 -0.351684,0.036314c-0.0582186,-0.0473209 -0.0921077,-0.118286 -0.0923143,-0.19331Z" />
    </g>
  </svg>
);

export const PlaylistIcon = props => (
  <svg viewBox="0 0 24 24" {...props}>
    <g fill="currentColor">
      <path d="M18.487,18.237l-8.63315e-09,1.01778e-10c-0.137395,0.00161976 -0.24838,0.112605 -0.25,0.25v5.089l-8.61357e-09,-1.92879e-06c0.000618524,0.138622 0.113495,0.250496 0.252117,0.249878c0.0177853,-7.93569e-05 0.0355117,-0.00204883 0.0528807,-0.00587522l4.91941e-07,-1.11286e-07c2.62995,-0.594941 4.68356,-2.64893 5.278,-5.279l-9.75465e-10,4.47169e-09c0.0161004,-0.0738071 -0.00189733,-0.15094 -0.049,-0.21l4.26914e-09,5.39241e-09c-0.0482506,-0.060946 -0.122286,-0.0957425 -0.2,-0.094Z" />
      <path d="M16.737,18.487l8.28043e-09,-7.24466e-06c0.00110615,-0.966041 0.783966,-1.74889 1.75001,-1.74999h5.25h-1.09278e-08c0.138071,6.03528e-09 0.25,-0.111929 0.25,-0.25v-14.475v0c0,-1.10457 -0.895431,-2 -2,-2h-19.974h-8.74228e-08c-1.10457,4.82823e-08 -2,0.895431 -2,2c0,0 0,0 0,0v19.975l2.13163e-14,-3.01992e-07c-1.66785e-07,1.10457 0.89543,2 2,2h14.474h-1.09278e-08c0.138071,6.03528e-09 0.25,-0.111929 0.25,-0.25Zm4.026,-7.225h-3.27835e-08c0.414214,-1.81058e-08 0.75,0.335786 0.75,0.75c1.81059e-08,0.414214 -0.335786,0.75 -0.75,0.75h-13h-1.09278e-08c-0.138071,6.03528e-09 -0.25,0.111929 -0.25,0.25c0,0 0,0 0,0v3.25l3.55271e-15,3.7749e-08c2.08482e-08,0.138071 0.111929,0.25 0.25,0.25h6.5h-3.27835e-08c0.414214,-1.81059e-08 0.75,0.335786 0.75,0.75c1.81058e-08,0.414214 -0.335786,0.75 -0.75,0.75h-6.5h-1.09278e-08c-0.138071,6.03528e-09 -0.25,0.111929 -0.25,0.25c0,0 0,0 0,0v2.5v0c0,0.414214 -0.335786,0.75 -0.75,0.75c-0.414214,0 -0.75,-0.335786 -0.75,-0.75v-2.5v0c0,-0.138071 -0.111929,-0.25 -0.25,-0.25h-2.5h-3.27835e-08c-0.414214,-1.81059e-08 -0.75,-0.335786 -0.75,-0.75c1.81059e-08,-0.414214 0.335786,-0.75 0.75,-0.75h2.5h-1.09278e-08c0.138071,6.03528e-09 0.25,-0.111929 0.25,-0.25v-3.25v0c0,-0.138071 -0.111929,-0.25 -0.25,-0.25h-2.5h-3.27835e-08c-0.414214,-1.81059e-08 -0.75,-0.335786 -0.75,-0.75c1.81059e-08,-0.414214 0.335786,-0.75 0.75,-0.75h2.5h-1.09278e-08c0.138071,6.03528e-09 0.25,-0.111929 0.25,-0.25v-3.25v0c0,-0.138071 -0.111929,-0.25 -0.25,-0.25h-2.5l-3.27835e-08,-8.88178e-16c-0.414214,-1.81059e-08 -0.75,-0.335786 -0.75,-0.75c1.81059e-08,-0.414214 0.335786,-0.75 0.75,-0.75h2.5h-1.09278e-08c0.138071,6.03528e-09 0.25,-0.111929 0.25,-0.25v-2.5l8.88178e-15,1.13247e-07c-6.25445e-08,-0.414214 0.335786,-0.75 0.75,-0.75c0.414214,-6.25445e-08 0.75,0.335786 0.75,0.75c0,0 0,8.88178e-16 0,8.88178e-16v2.5l1.77636e-15,3.77489e-08c2.08482e-08,0.138071 0.111929,0.25 0.25,0.25h13l-3.27835e-08,8.88178e-16c0.414214,-1.81059e-08 0.75,0.335786 0.75,0.75c1.81059e-08,0.414214 -0.335786,0.75 -0.75,0.75h-13h-1.09278e-08c-0.138071,6.03528e-09 -0.25,0.111929 -0.25,0.25c0,0 0,8.88178e-16 0,8.88178e-16v3.25l2.66454e-15,3.7749e-08c2.08482e-08,0.138071 0.111929,0.25 0.25,0.25Z" />
    </g>
  </svg>
);

export const More = props => (
  <svg viewBox="0 0 18 18" {...props}>
    <path d="M0,0h18v18h-18Z" fill="none" />
    <path
      fill="currentColor"
      d="M4,7.5c-0.83,0 -1.5,0.67 -1.5,1.5c0,0.83 0.67,1.5 1.5,1.5c0.83,0 1.5,-0.67 1.5,-1.5c0,-0.83 -0.67,-1.5 -1.5,-1.5Zm10,0c-0.83,0 -1.5,0.67 -1.5,1.5c0,0.83 0.67,1.5 1.5,1.5c0.83,0 1.5,-0.67 1.5,-1.5c0,-0.83 -0.67,-1.5 -1.5,-1.5Zm-5,0c-0.83,0 -1.5,0.67 -1.5,1.5c0,0.83 0.67,1.5 1.5,1.5c0.83,0 1.5,-0.67 1.5,-1.5c0,-0.83 -0.67,-1.5 -1.5,-1.5Z"
    />
  </svg>
);

export const Rook = props => (
  <svg viewBox="0 0 24 24" {...props}>
    <g
      strokeLinecap="round"
      strokeWidth="1"
      stroke="currentColor"
      fill="none"
      strokeLinejoin="round">
      <path d="M4,23.5c-0.27614,0 -0.5,-0.22386 -0.5,-0.5v-2c0,-0.27614 0.22386,-0.5 0.5,-0.5h16c0.27614,0 0.5,0.22386 0.5,0.5v2c0,0.27614 -0.22386,0.5 -0.5,0.5Z" />
      <path d="M19.5,20.5v0c0,-1.65685 -1.34315,-3 -3,-3h-9l-1.31134e-07,3.55271e-15c-1.65685,7.24234e-08 -3,1.34315 -3,3c0,0 0,3.55271e-15 0,3.55271e-15Z" />
      <path d="M7.5,8.5h9v9h-9Z" />
      <path d="M18.5,6v0c0,0.276142 -0.223858,0.5 -0.5,0.5h-12l-2.18557e-08,-1.77636e-15c-0.276142,-1.20706e-08 -0.5,-0.223858 -0.5,-0.5c0,0 0,0 0,0v-5l5.32907e-15,7.54979e-08c-4.16963e-08,-0.276142 0.223858,-0.5 0.5,-0.5h2l-2.18557e-08,4.44089e-16c0.276142,-1.20706e-08 0.5,0.223858 0.5,0.5v1.5h2v-1.5l5.32907e-15,7.54979e-08c-4.16963e-08,-0.276142 0.223858,-0.5 0.5,-0.5h2l-2.18557e-08,4.44089e-16c0.276142,-1.20706e-08 0.5,0.223858 0.5,0.5v1.5h2v-1.5l3.55271e-15,7.54979e-08c-4.16963e-08,-0.276142 0.223858,-0.5 0.5,-0.5c2.54893e-08,-3.88578e-15 5.00086e-08,-5.77316e-15 7.54979e-08,-5.77316e-15h2l-2.18557e-08,4.996e-16c0.276142,-1.20706e-08 0.5,0.223858 0.5,0.5Z" />
      <path d="M6.5,6.5h11v1.5v0c0,0.276142 -0.223858,0.5 -0.5,0.5h-10h-2.18557e-08c-0.276142,-1.20706e-08 -0.5,-0.223858 -0.5,-0.5c0,0 0,0 0,0v-1.5Z" />
    </g>
  </svg>
);

export const Logout = props => (
  <svg viewBox="0 0 24 24" {...props}>
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5">
      <path d="m20.249 18.754v1.5c0 .828427-.671573 1.5-1.5 1.5h-4.5" />
      <path d="m14.249 3.754h4.5-.00000007c.828427-.00000004 1.5.671573 1.5 1.5v1.5" />
      <path d="m10.393 23.246-9-1.286h-.00000001c-.369339-.0527292-.643765-.368916-.644-.742v-17.493l-.00000003-.00003758c-.0002733-.353941.246934-.659896.593037-.73397l9-2.221-.00000005.00000001c.405036-.0867089.803675.171347.890383.576383.0110902.0518047.0166601.104639.0166166.157617v21l.00000001-.00000986c-.00024771.414213-.336235.749799-.750448.749551-.0353263-.00002113-.070607-.00253812-.105579-.00753219z" />
      <path d="m20.249 9.753 3 3h-8.25" />
      <path d="m20.25 15.75 3-3" />
      <path d="m7.874 11.629h-.00000001c-.207107.00001179-.37499.167915-.374979.375021.00001179.207107.167915.37499.375021.374979.207107-.00001179.37499-.167915.374979-.375021-.00000008-.00132625-.00000719-.00265249-.00002133-.00397867v-.00000111c.00055241-.206554-.166445-.374446-.372998-.374999-.00066756-.00000179-.00133512-.00000178-.00200268.00000001" />
    </g>
  </svg>
);

export const Login = props => (
  <svg viewBox="0 0 24 24" {...props}>
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="m11.5 12h12" />
      <path d="m15.5 8-4 4 4 4" />
      <path d="m9.5 2.5h7.5-.00000002c.276142-.00000001.5.223858.5.5v2.5" />
      <path d="m17.5 18.5v2.5c0 .276142-.223858.5-.5.5h-7.5" />
      <path d="m.5 21.223-.00000001-.000024c.00008098.234454.16306.437366.391977.488019l8 1.777-.00000005-.00000001c.269621.0596597.536555-.110547.596215-.380168.00783476-.0354077.0117942-.0715627.0118085-.107827v-22l.00000001.00002404c-.00009534-.276142-.22403-.499923-.500173-.499827-.0362561.00001252-.0724033.00396848-.107804.0117981l-8 1.778c-.228931.050633-.391931.253542-.392023.488005z" />
      <path d="m7.06066 10.9393c.585786.585786.585786 1.53553 0 2.12132-.585786.585786-1.53553.585786-2.12132 0-.585786-.585786-.585786-1.53553 0-2.12132.585786-.585786 1.53553-.585786 2.12132 0" />
    </g>
  </svg>
);

export const History = props => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M0,0h24v24h-24Z" fill="none" />
    <path
      fill="currentColor"
      d="M13,3c-4.97,0 -9,4.03 -9,9h-3l3.89,3.89l0.07,0.14l4.04,-4.03h-3c0,-3.87 3.13,-7 7,-7c3.87,0 7,3.13 7,7c0,3.87 -3.13,7 -7,7c-1.93,0 -3.68,-0.79 -4.94,-2.06l-1.42,1.42c1.63,1.63 3.87,2.64 6.36,2.64c4.97,0 9,-4.03 9,-9c0,-4.97 -4.03,-9 -9,-9Zm-1,5v5l4.28,2.54l0.72,-1.21l-3.5,-2.08v-4.25h-1.5Z"
    />
  </svg>
);

export const Mail = props => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export const CloseOverlay = props => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="m16.5 23.306h-.00000004c.552285.00000002 1-.447715 1-1v-10.75.0000006c-.00055373-.137518.110478-.249447.247995-.250001.00066801-.00000269.00133602-.00000269.00200403 0h3.258-.00000001c.552284.00063694 1.00052-.446562 1.00115-.998846.00031543-.273505-.111408-.535204-.309152-.724154l-9.009-8.616-.00000002-.00000002c-.386562-.369527-.995438-.369527-1.382.00000003l-9.009 8.616-.00000005.00000005c-.399302.381545-.413697 1.01455-.0321519 1.41385.18871.197493.449995.309193.723152.309152h3.259c.137518-.0005534.249447.110478.25.247996.00000269.00066801.00000269.00133602 0 .00200403v10.75.00000015c.00000008.552285.447715 1 1 1z" />
  </svg>
);

export const Play = props => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="m23.14 10.608-20.887-10.444h-.00000001c-.770994-.383287-1.70672-.0689884-2.09001.702006-.10675.214731-.162525.451193-.162988.690994v20.887l.00000002.00001113c.00132868.860459.699945 1.55692 1.5604 1.55559.240399-.00037121.477452-.0563681.692606-.163608l20.887-10.443.00000007-.00000003c.769056-.384698 1.08064-1.32.695942-2.08906-.15063-.301127-.394815-.545312-.695942-.695942z" />
  </svg>
);

export const Dismiss = props => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="m14.3 12.179-.00000003-.00000003c-.0977544-.0975076-.0979544-.255799-.00044684-.353553.00014878-.00014915.00029774-.00029812.00044689-.00044689l9.263-9.262.00000003-.00000003c.585698-.586526.585026-1.5368-.00150012-2.1225-.586526-.585698-1.5368-.585026-2.1225.00150012l-9.262 9.258c-.0975076.0977544-.255799.0979545-.353553.0004469-.00014915-.00014878-.00029812-.00029774-.00044689-.00044689l-9.262-9.258.00000003.00000003c-.585698-.585974-1.53553-.586198-2.1215-.00050007-.585974.585698-.586198 1.53553-.00050007 2.1215l9.261 9.262.00000001.00000001c.0977544.0975076.0979545.255799.00044687.353553-.00014878.00014915-.00029774.00029812-.00044689.00044689l-9.261 9.263-.00000013.00000013c-.585698.585974-.585474 1.5358.00050025 2.1215.585974.585698 1.5358.585474 2.1215-.00050025l9.262-9.263-.00000002.00000002c.0975076-.0977544.255799-.0979545.353553-.00044693.00014915.00014878.00029812.00029774.00044689.00044689l9.262 9.263-.00000013-.00000013c.585698.585974 1.53553.586198 2.1215.00050025.585974-.585698.586198-1.53553.00050025-2.1215z" />
  </svg>
);

export const AddPlaylist = props => (
  <svg version="1.1" viewBox="0 0 24 24" {...props}>
    <g
      strokeLinecap="round"
      strokeWidth="1.5"
      stroke="currentColor"
      fill="none"
      strokeLinejoin="round">
      <path d="M21.4926,12.8804c2.34315,2.34315 2.34315,6.14214 0,8.48528c-2.34315,2.34315 -6.14214,2.34315 -8.48528,0c-2.34315,-2.34315 -2.34315,-6.14214 -1.77636e-15,-8.48528c2.34315,-2.34315 6.14214,-2.34315 8.48528,-1.77636e-15" />
      <path d="M17.25,14.12v6" />
      <path d="M14.25,17.12h6" />
      <path d="M5.25,2.12h15" />
      <path d="M5.25,8.12h15" />
      <path d="M5.25,14.12h3" />
      <path d="M1.125,1.748l-1.63918e-08,6.66134e-16c0.207107,-9.05293e-09 0.375,0.167893 0.375,0.375c9.05293e-09,0.207107 -0.167893,0.375 -0.375,0.375c-0.207107,9.05293e-09 -0.375,-0.167893 -0.375,-0.375l4.21885e-15,5.66234e-08c-3.12723e-08,-0.207107 0.167893,-0.375 0.375,-0.375" />
      <path d="M1.125,7.748l-1.63918e-08,8.88178e-16c0.207107,-9.05292e-09 0.375,0.167893 0.375,0.375c9.05293e-09,0.207107 -0.167893,0.375 -0.375,0.375c-0.207107,9.05293e-09 -0.375,-0.167893 -0.375,-0.375l4.21885e-15,5.66234e-08c-3.12723e-08,-0.207107 0.167893,-0.375 0.375,-0.375" />
      <path d="M1.125,13.748h-1.63918e-08c0.207107,-9.05293e-09 0.375,0.167893 0.375,0.375c9.05293e-09,0.207107 -0.167893,0.375 -0.375,0.375c-0.207107,9.05293e-09 -0.375,-0.167893 -0.375,-0.375l4.21885e-15,5.66234e-08c-3.12723e-08,-0.207107 0.167893,-0.375 0.375,-0.375" />
    </g>
  </svg>
);

export const Add = props => (
  <svg version="1.1" viewBox="0 0 24 24" {...props}>
    <g fill="currentColor">
      <path d="M18.48,6.449l1.41751e-08,1.04489e-08c-0.555253,-0.409295 -1.33717,-0.290973 -1.74647,0.264281c-0.000176723,0.000239743 -0.000353359,0.00047955 -0.00052991,0.000719419l-5.924,8.04l-3.767,-3.014l9.63886e-08,7.38363e-08c-0.548479,-0.420149 -1.33371,-0.316118 -1.75386,0.232361c-0.407579,0.532069 -0.323416,1.29083 0.190858,1.72064l4.783,3.826l2.09626e-08,1.63963e-08c0.54943,0.429747 1.34321,0.332725 1.77296,-0.216705c0.00473653,-0.00605563 0.00941766,-0.0121544 0.0140428,-0.0182955l6.7,-9.087l3.84876e-08,-5.24374e-08c0.408483,-0.556537 0.288461,-1.33884 -0.268076,-1.74732c-0.000308912,-0.000226733 -0.000617928,-0.000453324 -0.000927048,-0.000679772Z" />
      <path d="M12,0l-5.24537e-07,1.24345e-14c-6.62742,2.89694e-07 -12,5.37258 -12,12c2.89694e-07,6.62742 5.37258,12 12,12c6.62742,-2.89694e-07 12,-5.37258 12,-12l-1.33293e-07,-0.000122655c-0.00723277,-6.62445 -5.37568,-11.9928 -12.0001,-11.9999Zm0,22l-4.37114e-07,-1.06581e-14c-5.52285,-2.41411e-07 -10,-4.47715 -10,-10c2.41411e-07,-5.52285 4.47715,-10 10,-10c5.52285,2.41411e-07 10,4.47715 10,10l7.01811e-08,-6.40904e-05c-0.00602727,5.52033 -4.4796,9.99397 -9.99994,10.0001Z" />
    </g>
  </svg>
);

export const Favorite = props => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props} fill="currentColor">
    <path d="m23.123 10.39.00000002-.00000002c.630157-.537767.705054-1.48456.167286-2.11471-.284827-.333761-.701512-.526077-1.14029-.526286h-6.089.00000002c-.211916-.00027118-.400644-.134104-.471-.334l-2.185-6.191.00000005.00000012c-.290871-.775684-1.15548-1.1687-1.93117-.877832-.405648.152113-.725719.472183-.877832.877831l-.007.019-2.179 6.172.00000001-.00000001c-.070356.199896-.259084.333729-.471.334h-6.089.00000004c-.828427-.00062292-1.5005.670445-1.50113 1.49887-.00033449.444837.196789.866877.538127 1.15213l5.183 4.3-.00000001-.00000001c.159074.131463.22104.34715.156.543l-2.178 6.529-.00000005.00000015c-.26363.78536.159316 1.63573.944677 1.89936.462259.155171.971098.0759676 1.36432-.212365l5.348-3.921.00000001-.00000001c.175919-.128886.415081-.128886.591.00000001l5.346 3.921c.667897.490107 1.60665.345979 2.09675-.321918.288218-.392772.367736-.901051.213248-1.36308l-2.178-6.535.00000001.00000004c-.0652692-.195645-.00371276-.411291.155-.543zm-12.123 5.359v-1.749c0-.138071-.111929-.25-.25-.25h-1.75-.00000004c-.552285-.00000002-1-.447715-1-1 .00000002-.552285.447715-1 1-1h1.75c.138071-.00000003.25-.111929.25-.25v-1.751.00000015c-.00000008-.552285.447715-1 1-1 .552285-.00000008 1 .447715 1 1v1.751.00000004c.00000002.138071.111929.25.25.25h1.75-.00000004c.552285-.00000002 1 .447715 1 1 .00000002.552285-.447715 1-1 1h-1.75-.00000001c-.138071.00000001-.25.111929-.25.25v1.75c0 .552285-.447715 1-1 1s-1-.447715-1-1z" />
  </svg>
);

export const Search = props => (
  <svg viewBox="0 0 24 24" {...props}>
    <g
      strokeLinecap="round"
      strokeWidth="1.5"
      stroke="currentColor"
      fill="none"
      strokeLinejoin="round">
      <path d="M12.013,23.25l1.72451e-07,-1.99279e-10c-6.2132,0.0071798 -11.2558,-5.02379 -11.263,-11.237c-0.0071798,-6.2132 5.02379,-11.2558 11.237,-11.263c6.2132,-0.0071798 11.2558,5.02379 11.263,11.237c5.00458e-06,0.00433083 7.50835e-06,0.00866166 7.51131e-06,0.0129925" />
      <path d="M8.247,12.74l-0.463,-1.854l4.46269e-08,1.78405e-07c-0.166995,-0.667595 -0.766835,-1.13592 -1.455,-1.136h-5.353l-1.37491e-07,6.75405e-07c-0.843374,4.14295 0.708147,8.40886 4.016,11.042l1.008,-5.042h1.477" />
      <path d="M20.985,5.25h-4.064l2.33738e-08,-2.56506e-12c-0.688165,7.55028e-05 -1.28801,0.468405 -1.455,1.136l-0.266,1.065" />
      <path d="M19.4763,12.0377c2.05025,2.05025 2.05025,5.37437 0,7.42462c-2.05025,2.05025 -5.37437,2.05025 -7.42462,0c-2.05025,-2.05025 -2.05025,-5.37437 -1.77636e-15,-7.42462c2.05025,-2.05025 5.37437,-2.05025 7.42462,-1.77636e-15" />
      <path d="M23.25,23.25l-3.77,-3.79" />
    </g>
  </svg>
);

export const Expand = props => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
    <g>
      <path d="m24 2c0-1.10457-.895431-2-2-2h-16-.00000009c-1.10457.00000005-2 .895431-2 2v8.5.00000015c.00000008.552285.447715 1 1 1 .552285-.00000008 1-.447715 1-1v-8-.00000001c.00000004-.276142.223858-.5.5-.5h15-.00000002c.276142-.00000001.5.223858.5.5v15c0 .276142-.223858.5-.5.5h-8-.00000004c-.552285.00000002-1 .447715-1 1 .00000002.552285.447715 1 1 1h8.5-.00000009c1.10457.00000005 2-.89543 2-2z" />
      <path d="m2.25 22.5h-.5-.00000001c-.138071-.00000001-.25-.111929-.25-.25v-.5c0-.414214-.335786-.75-.75-.75s-.75.335786-.75.75v1.5-.0000001c-.00000006.414214.335786.75.75.75h.00000001 1.5-.00000003c.414214.00000002.75-.335786.75-.75.00000002-.414214-.335786-.75-.75-.75z" />
      <path d="m10.75 21h-.00000003c-.414214.00000002-.75.335786-.75.75v.5c0 .138071-.111929.25-.25.25h-.5-.00000003c-.414214.00000002-.75.335786-.75.75.00000002.414214.335786.75.75.75h1.5-.00000003c.414214.00000002.75-.335786.75-.75v-1.5-.00000007c0-.414214-.335786-.75-.75-.75-.00000003 0-.00000007 0-.0000001 0z" />
      <path d="m2.25 12.5h-1.5-.00000003c-.414214.00000002-.75.335786-.75.75v1.5.00000011c.00000006.414214.335787.75.75.75.414214-.00000006.75-.335787.75-.75v-.5.00000004c.00000002-.138071.111929-.25.25-.25h.5-.00000003c.414214.00000002.75-.335786.75-.75.00000002-.414214-.335786-.75-.75-.75z" />
      <path d="m11.5 13.25c0-.414214-.335786-.75-.75-.75h-1.5-.00000003c-.414214.00000002-.75.335786-.75.75.00000002.414214.335786.75.75.75h.5-.00000001c.138071-.00000001.25.111929.25.25v.5.00000011c.00000006.414214.335787.75.75.75.414214-.00000006.75-.335787.75-.75z" />
      <path d="m.75 19.5h-.00000003c.414214.00000002.75-.335786.75-.75v-1c0-.414214-.335786-.75-.75-.75s-.75.335786-.75.75v1 .00000008c.00000006.414214.335787.75.75.75z" />
      <path d="m10.75 17h-.00000003c-.414214.00000002-.75.335786-.75.75v1 .00000011c.00000006.414214.335787.75.75.75.414214-.00000006.75-.335787.75-.75v-1 .00000008c0-.414214-.335786-.75-.75-.75z" />
      <path d="m6.25 22.5h-1-.00000003c-.414214.00000002-.75.335786-.75.75.00000002.414214.335786.75.75.75h1-.00000003c.414214.00000002.75-.335786.75-.75.00000002-.414214-.335786-.75-.75-.75z" />
      <path d="m6.25 12.5h-1-.00000003c-.414214.00000002-.75.335786-.75.75.00000002.414214.335786.75.75.75h1-.00000003c.414214.00000002.75-.335786.75-.75.00000002-.414214-.335786-.75-.75-.75z" />
      <path d="m13.293 10.707-.00000006-.00000006c.3905.390382 1.0235.390382 1.414.00000012l2.293-2.293-.00000002.00000002c.0975076-.0977544.255799-.0979545.353553-.00044693.00014915.00014878.00029812.00029774.00044689.00044689l1.866 1.866-.00000007-.00000007c.293075.292711.767949.292416 1.06066-.00065926.140289-.140464.219165-.330818.21934-.529341v-5.5c0-.414214-.335786-.75-.75-.75h-5.5c-.414213.00036433-.749704.336446-.74934.750659.00017461.198522.0790509.388877.21934.529341l1.866 1.866.00000001.00000001c.0977544.0975076.0979545.255799.00044687.353553-.00014878.00014915-.00029774.00029812-.00044689.00044689l-2.293 2.293.00000005-.00000005c-.390382.3905-.390382 1.0235-.00000011 1.414z" />
    </g>
  </svg>
);

export const Collapse = props => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props} fill="currentColor">
    <g>
      <path d="m24 2c0-1.10457-.895431-2-2-2h-16-.00000009c-1.10457.00000005-2 .895431-2 2v8.5.00000015c.00000008.552285.447715 1 1 1 .552285-.00000008 1-.447715 1-1v-8-.00000001c.00000004-.276142.223858-.5.5-.5h15-.00000002c.276142-.00000001.5.223858.5.5v15c0 .276142-.223858.5-.5.5h-8-.00000004c-.552285.00000002-1 .447715-1 1 .00000002.552285.447715 1 1 1h8.5-.00000009c1.10457.00000005 2-.89543 2-2z" />
      <path d="m2.25 22.5h-.5-.00000001c-.138071-.00000001-.25-.111929-.25-.25v-.5c0-.414214-.335786-.75-.75-.75s-.75.335786-.75.75v1.5-.0000001c-.00000006.414214.335786.75.75.75h.00000001 1.5-.00000003c.414214.00000002.75-.335786.75-.75.00000002-.414214-.335786-.75-.75-.75z" />
      <path d="m10.75 21h-.00000003c-.414214.00000002-.75.335786-.75.75v.5c0 .138071-.111929.25-.25.25h-.5-.00000003c-.414214.00000002-.75.335786-.75.75.00000002.414214.335786.75.75.75h1.5-.00000003c.414214.00000002.75-.335786.75-.75v-1.5-.00000007c0-.414214-.335786-.75-.75-.75-.00000003 0-.00000007 0-.0000001 0z" />
      <path d="m2.25 12.5h-1.5-.00000003c-.414214.00000002-.75.335786-.75.75v1.5.00000011c.00000006.414214.335787.75.75.75.414214-.00000006.75-.335787.75-.75v-.5.00000004c.00000002-.138071.111929-.25.25-.25h.5-.00000003c.414214.00000002.75-.335786.75-.75.00000002-.414214-.335786-.75-.75-.75z" />
      <path d="m10.75 12.5h-1.5-.00000003c-.414214.00000002-.75.335786-.75.75.00000002.414214.335786.75.75.75h.5-.00000001c.138071-.00000001.25.111929.25.25v.5.00000011c.00000006.414214.335787.75.75.75.414214-.00000006.75-.335787.75-.75v-1.5.00000012c0-.414214-.335786-.75-.75-.75z" />
      <path d="m.75 19.5h-.00000003c.414214.00000002.75-.335786.75-.75v-1c0-.414214-.335786-.75-.75-.75s-.75.335786-.75.75v1 .00000008c.00000006.414214.335787.75.75.75z" />
      <path d="m10.75 17h-.00000003c-.414214.00000002-.75.335786-.75.75v1 .00000011c.00000006.414214.335787.75.75.75.414214-.00000006.75-.335787.75-.75v-1 .00000008c0-.414214-.335786-.75-.75-.75z" />
      <path d="m6.25 22.5h-1-.00000003c-.414214.00000002-.75.335786-.75.75.00000002.414214.335786.75.75.75h1-.00000003c.414214.00000002.75-.335786.75-.75.00000002-.414214-.335786-.75-.75-.75z" />
      <path d="m6.25 12.5h-1-.00000003c-.414214.00000002-.75.335786-.75.75.00000002.414214.335786.75.75.75h1-.00000003c.414214.00000002.75-.335786.75-.75.00000002-.414214-.335786-.75-.75-.75z" />
      <path d="m18.5 11.75h.00000002c.414213-.00036434.749704-.336446.74934-.750659-.00017462-.198522-.0790509-.388877-.21934-.529341l-1.866-1.87-.00000003-.00000003c-.0977544-.0975076-.0979544-.255799-.00044684-.353553.00014878-.00014915.00029774-.00029812.00044689-.00044689l2.543-2.543.00000001-.00000001c.397252-.383679.408255-1.01675.0245764-1.414-.383679-.397252-1.01675-.408255-1.414-.0245764-.00833389.00804914-.0165273.0162425-.0245764.0245764l-2.543 2.547c-.0975076.0977544-.255799.0979545-.353553.0004469-.00014915-.00014878-.00029812-.00029774-.00044689-.00044689l-1.866-1.866.00000002.00000002c-.293075-.292711-.767949-.292416-1.06066.00065935-.140289.140464-.219165.330818-.21934.529341v5.5.00000011c.00000006.414214.335787.75.75.75z" />
    </g>
  </svg>
);
