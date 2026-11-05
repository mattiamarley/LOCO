import('./portal.mjs?v=20261105e').catch(error=>{
 const target=document.querySelector('#portal');
 target.style.cssText='position:relative;padding:40px;width:auto;height:auto;transform:none';
 target.textContent='Impossibile aprire LOCO: '+error.message;
 console.error(error);
});
