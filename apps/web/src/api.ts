export async function api<T=unknown>(path:string,method='GET',body?:unknown):Promise<T>{
 const response=await fetch(`/api${path}`,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
 const json=await response.json();if(!response.ok)throw new Error(json.error||'Request failed');return json as T;
}
