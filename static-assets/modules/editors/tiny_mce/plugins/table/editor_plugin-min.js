(function(j){var h=j.each;
function k(d,c){var b=c.ownerDocument,e=b.createRange(),a;
e.setStartBefore(c);
e.setEnd(d.endContainer,d.endOffset);
a=b.createElement("body");
a.appendChild(e.cloneContents());
return a.innerHTML.replace(/<(br|img|object|embed|input|textarea)[^>]*>/gi,"-").replace(/<[^>]+>/g,"").length==0
}function g(a,b){return parseInt(a.getAttribute(b)||1)
}function f(N,P,b){var aj,a,V,ac;
T();
ac=P.getParent(b.getStart(),"th,td");
if(ac){a=Q(ac);
V=e();
ac=c(a.x,a.y)
}function ab(l,m){l=l.cloneNode(m);
l.removeAttribute("id");
return l
}function T(){var l=0;
aj=[];
h(["thead","tbody","tfoot"],function(n){var m=P.select("> "+n+" tr",N);
h(m,function(p,o){o+=l;
h(P.select("> td, > th",p),function(q,v){var u,t,s,r;
if(aj[o]){while(aj[o][v]){v++
}}s=g(q,"rowspan");
r=g(q,"colspan");
for(t=o;
t<o+s;
t++){if(!aj[t]){aj[t]=[]
}for(u=v;
u<v+r;
u++){aj[t][u]={part:n,real:t==o&&u==v,elm:q,rowspan:s,colspan:r}
}}})
});
l+=m.length
})
}function c(n,l){var m;
m=aj[l];
if(m){return m[n]
}}function U(l,n,m){if(l){m=parseInt(m);
if(m===1){l.removeAttribute(n,1)
}else{l.setAttribute(n,m,1)
}}}function ah(l){return l&&(P.hasClass(l.elm,"mceSelected")||l==ac)
}function ag(){var l=[];
h(N.rows,function(m){h(m.cells,function(n){if(P.hasClass(n,"mceSelected")||n==ac.elm){l.push(m);
return false
}})
});
return l
}function X(){var l=P.createRng();
l.setStartAfter(N);
l.setEndAfter(N);
b.setRng(l);
P.remove(N)
}function ak(m){var l;
j.walk(m,function(n){var o;
if(n.nodeType==3){h(P.getParents(n.parentNode,null,m).reverse(),function(p){p=ab(p,false);
if(!l){l=o=p
}else{if(o){o.appendChild(p)
}}o=p
});
if(o){o.innerHTML=j.isIE&&!j.isIE11?"&nbsp;":'<br data-mce-bogus="1" />'
}return false
}},"childNodes");
m=ab(m,false);
U(m,"rowSpan",1);
U(m,"colSpan",1);
if(l){m.appendChild(l)
}else{if(!j.isIE||j.isIE11){m.innerHTML='<br data-mce-bogus="1" />'
}}return m
}function Z(){var l=P.createRng();
h(P.select("tr",N),function(m){if(m.cells.length==0){P.remove(m)
}});
if(P.select("tr",N).length==0){l.setStartAfter(N);
l.setEndAfter(N);
b.setRng(l);
P.remove(N);
return
}h(P.select("thead,tbody,tfoot",N),function(m){if(m.rows.length==0){P.remove(m)
}});
T();
row=aj[Math.min(aj.length-1,a.y)];
if(row){b.select(row[Math.min(row.length-1,a.x)].elm,true);
b.collapse(true)
}}function R(n,p,l,o){var q,s,t,r,m;
q=aj[p][n].elm.parentNode;
for(t=1;
t<=l;
t++){q=P.getNext(q,"tr");
if(q){for(s=n;
s>=0;
s--){m=aj[p+t][s].elm;
if(m.parentNode==q){for(r=1;
r<=o;
r++){P.insertAfter(ak(m),m)
}break
}}if(s==-1){for(r=1;
r<=o;
r++){q.insertBefore(ak(q.cells[0]),q.cells[0])
}}}}}function W(){h(aj,function(m,l){h(m,function(r,s){var o,p,n,q;
if(ah(r)){r=r.elm;
o=g(r,"colspan");
p=g(r,"rowspan");
if(o>1||p>1){U(r,"rowSpan",1);
U(r,"colSpan",1);
for(q=0;
q<o-1;
q++){P.insertAfter(ak(r),r)
}R(s,l,p-1,o)
}}})
})
}function aa(o,r,l){var u,v,m,n,p,s,q,z,o,w,t;
if(o){pos=Q(o);
u=pos.x;
v=pos.y;
m=u+(r-1);
n=v+(l-1)
}else{a=V=null;
h(aj,function(B,A){h(B,function(C,D){if(ah(C)){if(!a){a={x:D,y:A}
}V={x:D,y:A}
}})
});
u=a.x;
v=a.y;
m=V.x;
n=V.y
}q=c(u,v);
z=c(m,n);
if(q&&z&&q.part==z.part){W();
T();
q=c(u,v).elm;
U(q,"colSpan",(m-u)+1);
U(q,"rowSpan",(n-v)+1);
for(s=v;
s<=n;
s++){for(p=u;
p<=m;
p++){if(!aj[s]||!aj[s][p]){continue
}o=aj[s][p].elm;
if(o!=q){w=j.grep(o.childNodes);
h(w,function(A){q.appendChild(A)
});
if(w.length){w=j.grep(q.childNodes);
t=0;
h(w,function(A){if(A.nodeName=="BR"&&P.getAttrib(A,"data-mce-bogus")&&t++<w.length-1){q.removeChild(A)
}})
}P.remove(o)
}}}Z()
}}function af(q){var u,o,r,p,n,m,t,l,s;
h(aj,function(v,w){h(v,function(z,A){if(ah(z)){z=z.elm;
n=z.parentNode;
m=ab(n,false);
u=w;
if(q){return false
}}});
if(q){return !u
}});
for(p=0;
p<aj[0].length;
p++){if(!aj[u][p]){continue
}o=aj[u][p].elm;
if(o!=r){if(!q){s=g(o,"rowspan");
if(s>1){U(o,"rowSpan",s+1);
continue
}}else{if(u>0&&aj[u-1][p]){l=aj[u-1][p].elm;
s=g(l,"rowSpan");
if(s>1){U(l,"rowSpan",s+1);
continue
}}}t=ak(o);
U(t,"colSpan",o.colSpan);
m.appendChild(t);
r=o
}}if(m.hasChildNodes()){if(!q){P.insertAfter(m,n)
}else{n.parentNode.insertBefore(m,n)
}}}function ai(m){var l,n;
h(aj,function(p,o){h(p,function(q,r){if(ah(q)){l=r;
if(m){return false
}}});
if(m){return !l
}});
h(aj,function(p,o){var s,r,q;
if(!p[l]){return
}s=p[l].elm;
if(s!=n){q=g(s,"colspan");
r=g(s,"rowspan");
if(q==1){if(!m){P.insertAfter(ak(s),s);
R(l,o,r-1,q)
}else{s.parentNode.insertBefore(ak(s),s);
R(l,o,r-1,q)
}}else{U(s,"colSpan",s.colSpan+1)
}n=s
}})
}function ad(){var l=[];
h(aj,function(n,m){h(n,function(o,p){if(ah(o)&&j.inArray(l,p)===-1){h(aj,function(q){var s=q[p].elm,r;
r=g(s,"colSpan");
if(r>1){U(s,"colSpan",r-1)
}else{P.remove(s)
}});
l.push(p)
}})
});
Z()
}function ae(){var l;
function m(o){var p,n,q;
p=P.getNext(o,"tr");
h(o.cells,function(s){var r=g(s,"rowSpan");
if(r>1){U(s,"rowSpan",r-1);
n=Q(s);
R(n.x,n.y,1,1)
}});
n=Q(o.cells[0]);
h(aj[n.y],function(s){var r;
s=s.elm;
if(s!=q){r=g(s,"rowSpan");
if(r<=1){P.remove(s)
}else{U(s,"rowSpan",r-1)
}q=s
}})
}l=ag();
h(l.reverse(),function(n){m(n)
});
Z()
}function S(){var l=ag();
P.remove(l);
Z();
return l
}function d(){var l=ag();
h(l,function(m,n){l[n]=ab(m,true)
});
return l
}function Y(n,o){if(!n){return
}var m=ag(),p=m[o?0:m.length-1],l=p.cells.length;
h(aj,function(q){var r;
l=0;
h(q,function(s,t){if(s.real){l+=s.colspan
}if(s.elm.parentNode==p){r=1
}});
if(r){return false
}});
if(!o){n.reverse()
}h(n,function(q){var r=q.cells.length,s;
for(i=0;
i<r;
i++){s=q.cells[i];
U(s,"colSpan",1);
U(s,"rowSpan",1)
}for(i=r;
i<l;
i++){q.appendChild(ak(q.cells[r-1]))
}for(i=l;
i<r;
i++){P.remove(q.cells[i])
}if(o){p.parentNode.insertBefore(q,p)
}else{P.insertAfter(q,p)
}});
P.removeClass(P.select("td.mceSelected,th.mceSelected"),"mceSelected")
}function Q(m){var l;
h(aj,function(o,n){h(o,function(p,q){if(p.elm==m){l={x:q,y:n};
return false
}});
return !l
});
return l
}function M(l){a=Q(l)
}function e(){var l,m,n;
m=n=0;
h(aj,function(p,o){h(p,function(s,t){var q,r;
if(ah(s)){s=aj[o][t];
if(t>m){m=t
}if(o>n){n=o
}if(s.real){q=s.colspan-1;
r=s.rowspan-1;
if(q){if(t+q>m){m=t+q
}}if(r){if(o+r>n){n=o+r
}}}}})
});
return{x:m,y:n}
}function O(n){var q,r,l,m,s,t,p,o;
V=Q(n);
if(a&&V){q=Math.min(a.x,V.x);
r=Math.min(a.y,V.y);
l=Math.max(a.x,V.x);
m=Math.max(a.y,V.y);
s=l;
t=m;
for(y=r;
y<=t;
y++){n=aj[y][q];
if(!n.real){if(q-(n.colspan-1)<q){q-=n.colspan-1
}}}for(x=q;
x<=s;
x++){n=aj[r][x];
if(!n.real){if(r-(n.rowspan-1)<r){r-=n.rowspan-1
}}}for(y=r;
y<=m;
y++){for(x=q;
x<=l;
x++){n=aj[y][x];
if(n.real){p=n.colspan-1;
o=n.rowspan-1;
if(p){if(x+p>s){s=x+p
}}if(o){if(y+o>t){t=y+o
}}}}}P.removeClass(P.select("td.mceSelected,th.mceSelected"),"mceSelected");
for(y=r;
y<=t;
y++){for(x=q;
x<=s;
x++){if(aj[y][x]){P.addClass(aj[y][x].elm,"mceSelected")
}}}}}j.extend(this,{deleteTable:X,split:W,merge:aa,insertRow:af,insertCol:ai,deleteCols:ad,deleteRows:ae,cutRows:S,copyRows:d,pasteRows:Y,getPos:Q,setStartCell:M,setEndCell:O})
}j.create("tinymce.plugins.TablePlugin",{init:function(n,e){var o,a,d=true;
function b(l){var m=n.selection,q=n.dom.getParent(l||m.getNode(),"table");
if(q){return new f(q,n.dom,m)
}}function c(){n.getBody().style.webkitUserSelect="";
if(d){n.dom.removeClass(n.dom.select("td.mceSelected,th.mceSelected"),"mceSelected");
d=false
}}h([["table","table.desc","mceInsertTable",true],["delete_table","table.del","mceTableDelete"],["delete_col","table.delete_col_desc","mceTableDeleteCol"],["delete_row","table.delete_row_desc","mceTableDeleteRow"],["col_after","table.col_after_desc","mceTableInsertColAfter"],["col_before","table.col_before_desc","mceTableInsertColBefore"],["row_after","table.row_after_desc","mceTableInsertRowAfter"],["row_before","table.row_before_desc","mceTableInsertRowBefore"],["row_props","table.row_desc","mceTableRowProps",true],["cell_props","table.cell_desc","mceTableCellProps",true],["split_cells","table.split_cells_desc","mceTableSplitCells",true],["merge_cells","table.merge_cells_desc","mceTableMergeCells",true]],function(l){n.addButton(l[0],{title:l[1],cmd:l[2],ui:l[3]})
});
if(!j.isIE){n.onClick.add(function(m,l){l=l.target;
if(l.nodeName==="TABLE"){m.selection.select(l);
m.nodeChanged()
}})
}n.onPreProcess.add(function(z,w){var A,v,u,l=z.dom,m;
A=l.select("table",w.node);
v=A.length;
while(v--){u=A[v];
l.setAttrib(u,"data-mce-style","");
if((m=l.getAttrib(u,"width"))){l.setStyle(u,"width",m);
l.setAttrib(u,"width","")
}if((m=l.getAttrib(u,"height"))){l.setStyle(u,"height",m);
l.setAttrib(u,"height","")
}}});
n.onNodeChange.add(function(p,t,l){var m;
l=p.selection.getStart();
m=p.dom.getParent(l,"td,th,caption");
t.setActive("table",l.nodeName==="TABLE"||!!m);
if(m&&m.nodeName==="CAPTION"){m=0
}t.setDisabled("delete_table",!m);
t.setDisabled("delete_col",!m);
t.setDisabled("delete_table",!m);
t.setDisabled("delete_row",!m);
t.setDisabled("col_after",!m);
t.setDisabled("col_before",!m);
t.setDisabled("row_after",!m);
t.setDisabled("row_before",!m);
t.setDisabled("row_props",!m);
t.setDisabled("cell_props",!m);
t.setDisabled("split_cells",!m);
t.setDisabled("merge_cells",!m)
});
n.onInit.add(function(l){var w,D,m=l.dom,C;
o=l.windowManager;
l.onMouseDown.add(function(p,q){if(q.button!=2){c();
D=m.getParent(q.target,"td,th");
w=m.getParent(D,"table")
}});
m.bind(l.getDoc(),"mouseover",function(s){var p,r,t=s.target;
if(D&&(C||t!=D)&&(t.nodeName=="TD"||t.nodeName=="TH")){r=m.getParent(t,"table");
if(r==w){if(!C){C=b(r);
C.setStartCell(D);
l.getBody().style.webkitUserSelect="none"
}C.setEndCell(t);
d=true
}p=l.selection.getSel();
try{if(p.removeAllRanges){p.removeAllRanges()
}else{p.empty()
}}catch(q){}s.preventDefault()
}});
l.onMouseUp.add(function(L,K){var t,r=L.selection,J,u=r.getSel(),v,q,s,M;
if(D){if(C){L.getBody().style.webkitUserSelect=""
}function p(H,F){var G=new j.dom.TreeWalker(H,H);
do{if(H.nodeType==3&&j.trim(H.nodeValue).length!=0){if(F){t.setStart(H,0)
}else{t.setEnd(H,H.nodeValue.length)
}return
}if(H.nodeName=="BR"){if(F){t.setStartBefore(H)
}else{t.setEndBefore(H)
}return
}}while(H=(F?G.next():G.prev()))
}J=m.select("td.mceSelected,th.mceSelected");
if(J.length>0){t=m.createRng();
q=J[0];
M=J[J.length-1];
t.setStartBefore(q);
t.setEndAfter(q);
p(q,1);
v=new j.dom.TreeWalker(q,m.getParent(J[0],"table"));
do{if(q.nodeName=="TD"||q.nodeName=="TH"){if(!m.hasClass(q,"mceSelected")){break
}s=q
}}while(q=v.next());
p(s);
r.setRng(t)
}L.nodeChanged();
D=C=w=null
}});
l.onKeyUp.add(function(p,q){c()
});
l.onKeyDown.add(function(p,q){A(p)
});
l.onMouseDown.add(function(p,q){if(q.button!=2){A(p)
}});
function z(p,t,s,H){var r=3,v=p.dom.getParent(t.startContainer,"TABLE"),q,u,I;
if(v){q=v.parentNode
}u=t.startContainer.nodeType==r&&t.startOffset==0&&t.endOffset==0&&H&&(s.nodeName=="TR"||s==q);
I=(s.nodeName=="TD"||s.nodeName=="TH")&&!H;
return u||I
}function A(p){if(!j.isWebKit){return
}var s=p.selection.getRng();
var r=p.selection.getNode();
var t=p.dom.getParent(s.startContainer,"TD,TH");
if(!z(p,s,r,t)){return
}if(!t){t=r
}var q=t.lastChild;
while(q.lastChild){q=q.lastChild
}s.setEnd(q,q.nodeValue.length);
p.selection.setRng(s)
}l.plugins.table.fixTableCellSelection=A;
if(l&&l.plugins.contextmenu){l.plugins.contextmenu.onContextMenu.add(function(p,q,t){var r,u=l.selection,s=u.getNode()||l.getBody();
if(l.dom.getParent(t,"td")||l.dom.getParent(t,"th")||l.dom.select("td.mceSelected,th.mceSelected").length){q.removeAll();
if(s.nodeName=="A"&&!l.dom.getAttrib(s,"name")){q.add({title:"advanced.link_desc",icon:"link",cmd:l.plugins.advlink?"mceAdvLink":"mceLink",ui:true});
q.add({title:"advanced.unlink_desc",icon:"unlink",cmd:"UnLink"});
q.addSeparator()
}if(s.nodeName=="IMG"&&s.className.indexOf("mceItem")==-1){q.add({title:"advanced.image_desc",icon:"image",cmd:l.plugins.advimage?"mceAdvImage":"mceImage",ui:true});
q.addSeparator()
}q.add({title:"table.desc",icon:"table",cmd:"mceInsertTable",value:{action:"insert"}});
q.add({title:"table.props_desc",icon:"table_props",cmd:"mceInsertTable"});
q.add({title:"table.del",icon:"delete_table",cmd:"mceTableDelete"});
q.addSeparator();
r=q.addMenu({title:"table.cell"});
r.add({title:"table.cell_desc",icon:"cell_props",cmd:"mceTableCellProps"});
r.add({title:"table.split_cells_desc",icon:"split_cells",cmd:"mceTableSplitCells"});
r.add({title:"table.merge_cells_desc",icon:"merge_cells",cmd:"mceTableMergeCells"});
r=q.addMenu({title:"table.row"});
r.add({title:"table.row_desc",icon:"row_props",cmd:"mceTableRowProps"});
r.add({title:"table.row_before_desc",icon:"row_before",cmd:"mceTableInsertRowBefore"});
r.add({title:"table.row_after_desc",icon:"row_after",cmd:"mceTableInsertRowAfter"});
r.add({title:"table.delete_row_desc",icon:"delete_row",cmd:"mceTableDeleteRow"});
r.addSeparator();
r.add({title:"table.cut_row_desc",icon:"cut",cmd:"mceTableCutRow"});
r.add({title:"table.copy_row_desc",icon:"copy",cmd:"mceTableCopyRow"});
r.add({title:"table.paste_row_before_desc",icon:"paste",cmd:"mceTablePasteRowBefore"}).setDisabled(!a);
r.add({title:"table.paste_row_after_desc",icon:"paste",cmd:"mceTablePasteRowAfter"}).setDisabled(!a);
r=q.addMenu({title:"table.col"});
r.add({title:"table.col_before_desc",icon:"col_before",cmd:"mceTableInsertColBefore"});
r.add({title:"table.col_after_desc",icon:"col_after",cmd:"mceTableInsertColAfter"});
r.add({title:"table.delete_col_desc",icon:"delete_col",cmd:"mceTableDeleteCol"})
}else{q.add({title:"table.desc",icon:"table",cmd:"mceInsertTable"})
}})
}if(j.isWebKit){function B(aa,s){var u=j.VK;
var p=s.keyCode;
function r(H,L,N){var M=H?"previousSibling":"nextSibling";
var G=aa.dom.getParent(L,"tr");
var I=G[M];
if(I){R(aa,L,I,H);
j.dom.Event.cancel(N);
return true
}else{var F=aa.dom.getParent(G,"table");
var J=G.parentNode;
var O=J.nodeName.toLowerCase();
if(O==="tbody"||O===(H?"tfoot":"thead")){var K=V(H,F,J,"tbody");
if(K!==null){return v(H,K,L,N)
}}return t(H,G,M,F,N)
}}function V(G,I,H,L){var J=aa.dom.select(">"+L,I);
var K=J.indexOf(H);
if(G&&K===0||!G&&K===J.length-1){return ab(G,I)
}else{if(K===-1){var F=H.tagName.toLowerCase()==="thead"?0:J.length-1;
return J[F]
}else{return J[K+(G?-1:1)]
}}}function ab(F,G){var H=F?"thead":"tfoot";
var I=aa.dom.select(">"+H,G);
return I.length!==0?I[0]:null
}function v(F,H,I,G){var J=S(H,F);
J&&R(aa,I,J,F);
j.dom.Event.cancel(G);
return true
}function t(L,H,K,M,F){var J=M[K];
if(J){X(J);
return true
}else{var G=aa.dom.getParent(M,"td,th");
if(G){return r(L,G,F)
}else{var I=S(H,!L);
X(I);
return j.dom.Event.cancel(F)
}}}function S(G,H){var F=G&&G[H?"lastChild":"firstChild"];
return F&&F.nodeName==="BR"?aa.dom.getParent(F,"td,th"):F
}function X(F){aa.selection.setCursorLocation(F,0)
}function ac(){return p==u.UP||p==u.DOWN
}function Z(H){var F=H.selection.getNode();
var G=H.dom.getParent(F,"tr");
return G!==null
}function q(G){var H=0;
var F=G;
while(F.previousSibling){F=F.previousSibling;
H=H+g(F,"colspan")
}return H
}function Y(G,I){var F=0;
var H=0;
h(G.children,function(K,J){F=F+g(K,"colspan");
H=J;
if(F>I){return false
}});
return H
}function R(I,F,L,G){var M=q(I.dom.getParent(F,"td,th"));
var J=Y(L,M);
var K=L.childNodes[J];
var H=S(K,G);
X(H||K)
}function U(I){var G=aa.selection.getNode();
var F=aa.dom.getParent(G,"td,th");
var H=aa.dom.getParent(I,"td,th");
return F&&F!==H&&T(F,H)
}function T(F,G){return aa.dom.getParent(F,"TABLE")===aa.dom.getParent(G,"TABLE")
}if(ac()&&Z(aa)){var W=aa.selection.getNode();
setTimeout(function(){if(U(W)){r(!s.shiftKey&&p===u.UP,W,s)
}},0)
}}l.onKeyDown.add(B)
}function E(){var p;
for(p=l.getBody().lastChild;
p&&p.nodeType==3&&!p.nodeValue.length;
p=p.previousSibling){}if(p&&p.nodeName=="TABLE"){if(l.settings.forced_root_block){l.dom.add(l.getBody(),l.settings.forced_root_block,null,j.isIE&&!j.isIE11?"&nbsp;":'<br data-mce-bogus="1" />')
}else{l.dom.add(l.getBody(),"br",{"data-mce-bogus":"1"})
}}}if(j.isGecko){l.onKeyDown.add(function(s,t){var q,p,r=s.dom;
if(t.keyCode==37||t.keyCode==38){q=s.selection.getRng();
p=r.getParent(q.startContainer,"table");
if(p&&s.getBody().firstChild==p){if(k(q,p)){q=r.createRng();
q.setStartBefore(p);
q.setEndBefore(p);
s.selection.setRng(q);
t.preventDefault()
}}}})
}l.onKeyUp.add(E);
l.onSetContent.add(E);
l.onVisualAid.add(E);
l.onPreProcess.add(function(q,p){var r=p.node.lastChild;
if(r&&(r.nodeName=="BR"||(r.childNodes.length==1&&(r.firstChild.nodeName=="BR"||r.firstChild.nodeValue=="\u00a0")))&&r.previousSibling&&r.previousSibling.nodeName=="TABLE"){q.dom.remove(r)
}});
E();
l.startContent=l.getContent({format:"raw"})
});
h({mceTableSplitCells:function(l){l.split()
},mceTableMergeCells:function(r){var m,l,s;
s=n.dom.getParent(n.selection.getNode(),"th,td");
if(s){m=s.rowSpan;
l=s.colSpan
}if(!n.dom.select("td.mceSelected,th.mceSelected").length){o.open({url:e+"/merge_cells.htm",width:240+parseInt(n.getLang("table.merge_cells_delta_width",0)),height:110+parseInt(n.getLang("table.merge_cells_delta_height",0)),inline:1},{rows:m,cols:l,onaction:function(p){r.merge(s,p.cols,p.rows)
},plugin_url:e})
}else{r.merge()
}},mceTableInsertRowBefore:function(l){l.insertRow(true)
},mceTableInsertRowAfter:function(l){l.insertRow()
},mceTableInsertColBefore:function(l){l.insertCol(true)
},mceTableInsertColAfter:function(l){l.insertCol()
},mceTableDeleteCol:function(l){l.deleteCols()
},mceTableDeleteRow:function(l){l.deleteRows()
},mceTableCutRow:function(l){a=l.cutRows()
},mceTableCopyRow:function(l){a=l.copyRows()
},mceTablePasteRowBefore:function(l){l.pasteRows(a,true)
},mceTablePasteRowAfter:function(l){l.pasteRows(a)
},mceTableDelete:function(l){l.deleteTable()
}},function(l,m){n.addCommand(m,function(){var q=b();
if(q){l(q);
n.execCommand("mceRepaint");
c()
}})
});
h({mceInsertTable:function(l){o.open({url:e+"/table.htm",width:400+parseInt(n.getLang("table.table_delta_width",0)),height:320+parseInt(n.getLang("table.table_delta_height",0)),inline:1},{plugin_url:e,action:l?l.action:0})
},mceTableRowProps:function(){o.open({url:e+"/row.htm",width:400+parseInt(n.getLang("table.rowprops_delta_width",0)),height:295+parseInt(n.getLang("table.rowprops_delta_height",0)),inline:1},{plugin_url:e})
},mceTableCellProps:function(){o.open({url:e+"/cell.htm",width:400+parseInt(n.getLang("table.cellprops_delta_width",0)),height:295+parseInt(n.getLang("table.cellprops_delta_height",0)),inline:1},{plugin_url:e})
}},function(l,m){n.addCommand(m,function(s,r){l(r)
})
})
}});
j.PluginManager.add("table",j.plugins.TablePlugin)
})(tinymce);