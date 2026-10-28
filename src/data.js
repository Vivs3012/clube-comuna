// Dados sintéticos para demonstração. Coordenadas aproximadas de referência urbana,
// não representam polígonos nem medições reais da operação TaDa.
export const demoRegions = [
  {id:'pinheiros',name:'Pinheiros',lat:-23.566,lon:-46.701,orders:1260,cancelled:119,delivered:1100,late:242,mean:39,p90:68,coverage:84,trend:[34,36,35,38,39,41,39]},
  {id:'centro',name:'Centro',lat:-23.548,lon:-46.638,orders:1640,cancelled:147,delivered:1450,late:319,mean:43,p90:76,coverage:91,trend:[39,40,42,41,45,44,43]},
  {id:'vila-mariana',name:'Vila Mariana',lat:-23.589,lon:-46.634,orders:980,cancelled:69,delivered:880,late:141,mean:32,p90:54,coverage:88,trend:[30,31,33,31,34,33,32]},
  {id:'itaim',name:'Itaim Bibi',lat:-23.585,lon:-46.678,orders:1120,cancelled:78,delivered:1010,late:162,mean:35,p90:59,coverage:78,trend:[33,34,33,35,36,34,35]},
  {id:'tatuape',name:'Tatuapé',lat:-23.540,lon:-46.576,orders:790,cancelled:111,delivered:670,late:201,mean:47,p90:82,coverage:58,trend:[42,43,45,47,49,46,47]},
  {id:'santana',name:'Santana',lat:-23.500,lon:-46.625,orders:510,cancelled:39,delivered:455,late:73,mean:36,p90:61,coverage:61,trend:[34,35,35,36,37,36,36]},
  {id:'moema',name:'Moema',lat:-23.603,lon:-46.666,orders:870,cancelled:52,delivered:790,late:111,mean:31,p90:52,coverage:93,trend:[30,30,31,32,31,32,31]},
  {id:'lapa',name:'Lapa',lat:-23.523,lon:-46.704,orders:420,cancelled:29,delivered:375,late:56,mean:37,p90:63,coverage:52,trend:[36,37,36,38,37,39,37]}
];

export const history = [
  {day:'16 out',orders:880,cancel:8.2,delivery:36}, {day:'17 out',orders:920,cancel:8.5,delivery:37},
  {day:'18 out',orders:1040,cancel:9.1,delivery:39}, {day:'19 out',orders:990,cancel:8.7,delivery:38},
  {day:'20 out',orders:1120,cancel:9.4,delivery:40}, {day:'21 out',orders:1080,cancel:9.0,delivery:39},
  {day:'22 out',orders:1160,cancel:9.3,delivery:40}
];
