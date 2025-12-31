// // src/components/common/Modal.tsx
// import React, { ReactNode, MouseEvent } from "react";

// type ModalProps = {
//   isOpen: boolean;
//   onClose: () => void;
//   title?: string;
//   children: ReactNode;
// };

// const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
//   if (!isOpen) return null;

//   const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
//     if (e.target === e.currentTarget) onClose();
//   };

//   return (
//     <div
//       onClick={handleBackdropClick}
//       style={{
//         position: "fixed",
//         inset: 0,
//         background: "rgba(15,23,42,0.45)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 1000,
//       }}
//     >
//       <div
//         style={{
//           width: "min(700px, 95vw)",
//           maxHeight: "80vh",
//           background: "var(--surface)",
//           color: "var(--text)",
//           borderRadius: "var(--radius-lg)",
//           boxShadow: "var(--shadow-high)",
//           padding: "var(--space-md)",
//           display: "flex",
//           flexDirection: "column",
//           gap: "var(--space-sm)",
//         }}
//       >
//         <header
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: "var(--space-sm)",
//           }}
//         >
//           {title && <h2 style={{ margin: 0 }}>{title}</h2>}
//           <button
//             type="button"
//             onClick={onClose}
//             style={{
//               border: "none",
//               background: "transparent",
//               cursor: "pointer",
//               fontSize: "1.25rem",
//               lineHeight: 1,
//               color: "var(--text-dim)",
//             }}
//             aria-label="Close"
//           >
//             ×
//           </button>
//         </header>
//         <div
//           style={{
//             overflow: "auto",
//             paddingRight: "0.25rem",
//           }}
//         >
//           {children}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Modal;
