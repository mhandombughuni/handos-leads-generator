'use client';
import Link from 'next/link';
import { useData } from './ui';
import { usePathname } from 'next/navigation';
import { Search, Layers3, ChartNoAxesCombined, Mail, FolderHeart } from 'lucide-react';
const navigation=[{href:'/',icon:Search,label:'Prospecting'},{href:'/saved-leads',icon:FolderHeart,label:'Saved leads'},{href:'/campaigns',icon:Layers3,label:'Campaigns'},{href:'/sequences',icon:Mail,label:'Sequences'},{href:'/analytics',icon:ChartNoAxesCombined,label:'Analytics'}];
export function Shell({children}:{children:React.ReactNode}){
 const path=usePathname();const {data:settings}=useData<{liveDiscovery:boolean;email:{provider:string;enabled:boolean;ready:boolean}}>('/api/settings');
 const active=(href:string)=>href==='/'?(path==='/'||path.startsWith('/leads')):path.startsWith(href);
 return <div className="figma-workspace"><header className="figma-header"><Link href="/" className="figma-brand"><img src="/handos-logo.png" alt="Handos" width={48} height={36}/><span><strong>handos</strong><small>TECHNOLOGIES</small></span><i/><span className="product-name">Lead prospector</span></Link><div className="workspace-controls"><span className="badge blue">{settings?.liveDiscovery?'LIVE DISCOVERY':'DEMO WORKSPACE'}</span><span className="avatar">HO</span></div></header>
 <aside className="sidebar"><p className="nav-label">WORKSPACE</p><nav>{navigation.map(n=><Link key={n.href} href={n.href} className={active(n.href)?'nav-link active':'nav-link'}><n.icon size={18}/>{n.label}</Link>)}</nav><div className="sidebar-bottom"><a className="help-link" href="https://handos.co" target="_blank" rel="noreferrer">Visit Handos ↗</a></div></aside>
 <div className="main-shell"><main>{children}</main><footer>Handos lead prospector <span>Audit first. Start a useful conversation.</span></footer></div><nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map(n=><Link key={n.href} href={n.href} className={active(n.href)?'active':''}><n.icon size={20}/><span>{n.label}</span></Link>)}</nav></div>;
}
