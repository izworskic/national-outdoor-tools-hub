(function(){
  function bindHub(){
    const N=window.NationalTools;
    const form=document.querySelector("[data-national-hub]");
    if(!N||!form)return;
    const panel=document.querySelector("[data-hub-results]");
    const placeNodes=document.querySelectorAll("[data-hub-place]");
    document.querySelectorAll("[data-hub-tool]").forEach(function(link){
      link.addEventListener("click",function(){
        if(typeof window.gtag!=="function")return;
        window.gtag("event","tool_handoff",{
          source_tool:form.dataset.nationalHub||"unknown",
          destination_tool:link.dataset.hubTool,
          surface:"topic_hub"
        });
      });
    });
    async function showLocation(loc){
      placeNodes.forEach(function(node){node.textContent=N.label(loc)});
      document.querySelectorAll("[data-hub-tool]").forEach(function(link){
        link.href=N.withQuery(link.dataset.hubTool,loc);
      });
      if(panel)panel.hidden=false;
      document.querySelectorAll("[data-hub-location-label]").forEach(function(node){node.hidden=false});
      N.track("National Intent Hub Resolved",{hub:form.dataset.nationalHub||"unknown"});
    }
    N.bind(form,showLocation);
    const q=new URLSearchParams(location.search).get("q");
    if(q){form.querySelector("input").value=q;form.requestSubmit();}
  }
  document.addEventListener("DOMContentLoaded",bindHub);
})();
