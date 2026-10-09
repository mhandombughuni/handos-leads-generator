import type { Metadata } from 'next';
import { Shell } from '@/components/shell';
import './globals.css';
import './figma.css';
export const metadata:Metadata={title:'Handos · Lead Engine',description:'Discover opportunities. Start thoughtful conversations. Measure what matters.',icons:{icon:{url:'/favicon.svg?v=86c3edc3dc03',type:'image/svg+xml'}}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Shell>{children}</Shell></body></html>}
