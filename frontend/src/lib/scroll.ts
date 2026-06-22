import { getLenis } from "../hooks/useLenis";

export const scrollTo = ( id: string ) => ( e?: React.MouseEvent ) => {
  e?.preventDefault();
  const el = document.getElementById(id);
  if( !el ) return;
  const lenis = getLenis();
  if( lenis ){
    lenis.scrollTo(el);
  }else{
    el.scrollIntoView({ behavior: "smooth" });
  }
};

export const scrollToTop = () => {
  const lenis = getLenis();
  if( lenis ) {
    lenis.scrollTo(0);
  }else{
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

export const goToSection = ( navigate: Function, id: string ) => {
  if( window.location.pathname === "/" ){
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }else{
    navigate("/", { state: { scrollTo: id } });
  }
};