(function(){var c=tinymce.each,d=tinymce.html.Node;
tinymce.create("tinymce.plugins.FullPagePlugin",{init:function(f,b){var a=this;
a.editor=f;
f.addCommand("mceFullPageProperties",function(){f.windowManager.open({file:b+"/fullpage.htm",width:430+parseInt(f.getLang("fullpage.delta_width",0)),height:495+parseInt(f.getLang("fullpage.delta_height",0)),inline:1},{plugin_url:b,data:a._htmlToData()})
});
f.addButton("fullpage",{title:"fullpage.desc",cmd:"mceFullPageProperties"});
f.onBeforeSetContent.add(a._setContent,a);
f.onGetContent.add(a._getContent,a)
},getInfo:function(){return{longname:"Fullpage",author:"Moxiecode Systems AB",authorurl:"http://tinymce.moxiecode.com",infourl:"http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/fullpage",version:tinymce.majorVersion+"."+tinymce.minorVersion}
},_htmlToData:function(){var k=this._parseHeader(),b={},n,a,j,l=this.editor;
function m(e,g){var f=e.attr(g);
return f||""
}b.fontface=l.getParam("fullpage_default_fontface","");
b.fontsize=l.getParam("fullpage_default_fontsize","");
a=k.firstChild;
if(a.type==7){b.xml_pi=true;
j=/encoding="([^"]+)"/.exec(a.value);
if(j){b.docencoding=j[1]
}}a=k.getAll("#doctype")[0];
if(a){b.doctype="<!DOCTYPE"+a.value+">"
}a=k.getAll("title")[0];
if(a&&a.firstChild){b.metatitle=a.firstChild.value
}c(k.getAll("meta"),function(e){var g=e.attr("name"),h=e.attr("http-equiv"),f;
if(g){b["meta"+g.toLowerCase()]=e.attr("content")
}else{if(h=="Content-Type"){f=/charset\s*=\s*(.*)\s*/gi.exec(e.attr("content"));
if(f){b.docencoding=f[1]
}}}});
a=k.getAll("html")[0];
if(a){b.langcode=m(a,"lang")||m(a,"xml:lang")
}a=k.getAll("link")[0];
if(a&&a.attr("rel")=="stylesheet"){b.stylesheet=a.attr("href")
}a=k.getAll("body")[0];
if(a){b.langdir=m(a,"dir");
b.style=m(a,"style");
b.visited_color=m(a,"vlink");
b.link_color=m(a,"link");
b.active_color=m(a,"alink")
}return b
},_dataToHtml:function(n){var o,q,m,b,a,p=this.editor.dom;
function r(g,f,e){g.attr(f,e?e:undefined)
}function l(e){if(q.firstChild){q.insert(e,q.firstChild)
}else{q.append(e)
}}o=this._parseHeader();
q=o.getAll("head")[0];
if(!q){b=o.getAll("html")[0];
q=new d("head",1);
if(b.firstChild){b.insert(q,b.firstChild,true)
}else{b.append(q)
}}b=o.firstChild;
if(n.xml_pi){a='version="1.0"';
if(n.docencoding){a+=' encoding="'+n.docencoding+'"'
}if(b.type!=7){b=new d("xml",7);
o.insert(b,o.firstChild,true)
}b.value=a
}else{if(b&&b.type==7){b.remove()
}}b=o.getAll("#doctype")[0];
if(n.doctype){if(!b){b=new d("#doctype",10);
if(n.xml_pi){o.insert(b,o.firstChild)
}else{l(b)
}}b.value=n.doctype.substring(9,n.doctype.length-1)
}else{if(b){b.remove()
}}b=o.getAll("title")[0];
if(n.metatitle){if(!b){b=new d("title",1);
b.append(new d("#text",3)).value=n.metatitle;
l(b)
}}if(n.docencoding){b=null;
c(o.getAll("meta"),function(e){if(e.attr("http-equiv")=="Content-Type"){b=e
}});
if(!b){b=new d("meta",1);
b.attr("http-equiv","Content-Type");
b.shortEnded=true;
l(b)
}b.attr("content","text/html; charset="+n.docencoding)
}c("keywords,description,author,copyright,robots".split(","),function(e){var f=o.getAll("meta"),i,g,h=n["meta"+e];
for(i=0;
i<f.length;
i++){g=f[i];
if(g.attr("name")==e){if(h){g.attr("content",h)
}else{g.remove()
}return
}}if(h){b=new d("meta",1);
b.attr("name",e);
b.attr("content",h);
b.shortEnded=true;
l(b)
}});
b=o.getAll("link")[0];
if(b&&b.attr("rel")=="stylesheet"){if(n.stylesheet){b.attr("href",n.stylesheet)
}else{b.remove()
}}else{if(n.stylesheet){b=new d("link",1);
b.attr({rel:"stylesheet",text:"text/css",href:n.stylesheet});
b.shortEnded=true;
l(b)
}}b=o.getAll("body")[0];
if(b){r(b,"dir",n.langdir);
r(b,"style",n.style);
r(b,"vlink",n.visited_color);
r(b,"link",n.link_color);
r(b,"alink",n.active_color);
p.setAttribs(this.editor.getBody(),{style:n.style,dir:n.dir,vLink:n.visited_color,link:n.link_color,aLink:n.active_color})
}b=o.getAll("html")[0];
if(b){r(b,"lang",n.langcode);
r(b,"xml:lang",n.langcode)
}m=new tinymce.html.Serializer({validate:false,indent:true,apply_source_formatting:true,indent_before:"head,html,body,meta,title,script,link,style",indent_after:"head,html,body,meta,title,script,link,style"}).serialize(o);
this.head=m.substring(0,m.indexOf("</body>"))
},_parseHeader:function(){return new tinymce.html.DomParser({validate:false,root_name:"#document"}).parse(this.head)
},_setContent:function(r,u){var a=this,p,v,q=u.content,s,b="",t=a.editor.dom,o;
function n(e){return e.replace(/<\/?[A-Z]+/g,function(f){return f.toLowerCase()
})
}if(u.format=="raw"&&a.head){return
}if(u.source_view&&r.getParam("fullpage_hide_in_source_view")){return
}q=q.replace(/<(\/?)BODY/gi,"<$1body");
p=q.indexOf("<body");
if(p!=-1){p=q.indexOf(">",p);
a.head=n(q.substring(0,p+1));
v=q.indexOf("</body",p);
if(v==-1){v=q.length
}u.content=q.substring(p+1,v);
a.foot=n(q.substring(v))
}else{a.head=this._getDefaultHeader();
a.foot="\n</body>\n</html>"
}s=a._parseHeader();
c(s.getAll("style"),function(e){if(e.firstChild){b+=e.firstChild.value
}});
o=s.getAll("body")[0];
if(o){t.setAttribs(a.editor.getBody(),{style:o.attr("style")||"",dir:o.attr("dir")||"",vLink:o.attr("vlink")||"",link:o.attr("link")||"",aLink:o.attr("alink")||""})
}t.remove("fullpage_styles");
if(b){t.add(a.editor.getDoc().getElementsByTagName("head")[0],"style",{id:"fullpage_styles"},b);
o=t.get("fullpage_styles");
if(o.styleSheet){o.styleSheet.cssText=b
}}},_getDefaultHeader:function(){var a="",h=this.editor,b,g="";
if(h.getParam("fullpage_default_xml_pi")){a+='<?xml version="1.0" encoding="'+h.getParam("fullpage_default_encoding","ISO-8859-1")+'" ?>\n'
}a+=h.getParam("fullpage_default_doctype",'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">');
a+="\n<html>\n<head>\n";
if(b=h.getParam("fullpage_default_title")){a+="<title>"+b+"</title>\n"
}if(b=h.getParam("fullpage_default_encoding")){a+='<meta http-equiv="Content-Type" content="text/html; charset='+b+'" />\n'
}if(b=h.getParam("fullpage_default_font_family")){g+="font-family: "+b+";"
}if(b=h.getParam("fullpage_default_font_size")){g+="font-size: "+b+";"
}if(b=h.getParam("fullpage_default_text_color")){g+="color: "+b+";"
}a+="</head>\n<body"+(g?' style="'+g+'"':"")+">\n";
return a
},_getContent:function(b,a){var f=this;
if(!a.source_view||!b.getParam("fullpage_hide_in_source_view")){a.content=tinymce.trim(f.head)+"\n"+tinymce.trim(a.content)+"\n"+tinymce.trim(f.foot)
}}});
tinymce.PluginManager.add("fullpage",tinymce.plugins.FullPagePlugin)
})();