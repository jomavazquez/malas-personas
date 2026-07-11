import { C } from "../../../lib";
import styles from "./ToastContainer.module.css";

export type ToastType = "info" | "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

const DOT_COLOR: Record<ToastType, string> = {
  info:    C.base,
  success: C.accent,
  error:   "#E5534B",
};

interface Props {
  toasts: ToastItem[];
  onDismiss: ( id: number ) => void;
}

export const ToastContainer = ({ toasts, onDismiss }: Props) => {

  if( !toasts.length ) return null;

  return (
    <div className={ styles.container }>
      {
        toasts.map((toast) => (
          <div 
            key={ toast.id } 
            className={ `${ styles.toast } ${ toast.exiting ? styles.toast_out : "" }` } 
            onClick={ () => onDismiss(toast.id) }
          >
            <span className={ styles.dot } style={{ background: DOT_COLOR[toast.type] }} />
            <span className={ styles.message } style={{ color: C.base }}>{ toast.message }</span>
          </div>
        ))
      }
    </div>
  );
};