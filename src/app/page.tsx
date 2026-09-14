import { redirect } from 'next/navigation';

/** 首屏指向完整中文游戏，所有玩法与像素素材都内置于 public/play.html。 */
export default function Home() {
  redirect('/play.html');
}
