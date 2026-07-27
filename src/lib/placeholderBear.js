/* 넣을 그림이 없을 때 쓰는 기본 곰 — 외부 파일 없이 코드로 그립니다. */

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#F7DCAE"/>
  <circle cx="128" cy="126" r="43" fill="#C08E5E"/>
  <circle cx="272" cy="126" r="43" fill="#C08E5E"/>
  <circle cx="128" cy="126" r="22" fill="#E8C9A4"/>
  <circle cx="272" cy="126" r="22" fill="#E8C9A4"/>
  <ellipse cx="200" cy="336" rx="122" ry="92" fill="#C08E5E"/>
  <ellipse cx="200" cy="352" rx="80" ry="66" fill="#E8C9A4"/>
  <circle cx="200" cy="202" r="106" fill="#C08E5E"/>
  <ellipse cx="200" cy="238" rx="61" ry="46" fill="#F2E0C6"/>
  <circle cx="128" cy="218" r="17" fill="#E9A29B" opacity=".55"/>
  <circle cx="272" cy="218" r="17" fill="#E9A29B" opacity=".55"/>
  <circle cx="166" cy="186" r="11" fill="#3B2A1C"/>
  <circle cx="234" cy="186" r="11" fill="#3B2A1C"/>
  <ellipse cx="200" cy="222" rx="16" ry="12" fill="#3B2A1C"/>
  <path d="M200 234 v13 M200 247 q-15 12 -29 1 M200 247 q15 12 29 1"
        stroke="#3B2A1C" stroke-width="5" fill="none" stroke-linecap="round"/>
</svg>`;

export const PLACEHOLDER_BEAR = {
  url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SVG.trim()),
  w: 400,
  h: 400,
  label: null,
};
