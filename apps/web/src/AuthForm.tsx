import {useState,type FormEvent} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {api} from './api';
export function AuthForm({mode}:{mode:'signup'|'join'|'login'}){
 const [error,setError]=useState('');const [pending,setPending]=useState(false);const navigate=useNavigate();const cache=useQueryClient();
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError('');setPending(true);const fields=Object.fromEntries(new FormData(event.currentTarget));if(fields.companyCode==='')delete fields.companyCode;try{await api(mode==='signup'?'/auth/signup-admin':`/auth/${mode}`,'POST',fields);cache.clear();const me=await api<{role:string}>('/me');navigate(me.role==='admin'?'/admin':'/t');}catch(e){setError(e instanceof Error?e.message:'Request failed');}finally{setPending(false);}}
 const fields=mode==='signup'?[['companyName','Company name'],['name','Your name'],['email','Email']]:mode==='join'?[['code','Invite code'],['name','Your name'],['username','Username']]:[['login','Email or username'],['companyCode','Company code (technicians only)']];
 return <main className="welcome"><Link className="wordmark" to="/">✓ DAYLY</Link><h1>{mode==='signup'?'Set up your company':mode==='join'?'Join your team':'Log in'}</h1><form onSubmit={submit}>{fields.map(([name,label])=><label key={name}>{label}<input name={name} type={name==='email'?'email':'text'} required={name!=='companyCode'} autoComplete={name==='email'?'email':name==='login'||name==='username'?'username':name==='name'?'name':'off'} maxLength={name==='code'?8:150}/></label>)}<label>Password<input name="password" type="password" minLength={10} maxLength={200} required autoComplete={mode==='login'?'current-password':'new-password'}/></label>{error?<p role="alert" className="error">{error}</p>:null}<button disabled={pending}>{pending?'Working…':mode==='login'?'Log in':'Continue'}</button></form></main>;
}
