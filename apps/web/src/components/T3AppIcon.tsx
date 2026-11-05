// The production icon, as GitHub shows the atQor AI Hub app, whatever this build's channel.
import appIconUrl from "../../../../assets/prod/t3-black-web-apple-touch-180.png";

export function AI_HUBAppIcon(props: { readonly className?: string }) {
  return <img src={appIconUrl} alt="" className={props.className} />;
}
