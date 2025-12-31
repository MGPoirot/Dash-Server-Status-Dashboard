// // src/components/logging/CpuTempTile.tsx (example)
// import React, { useState } from "react";
// import GearIconButton from "../common/GearIconButton";
// import Modal from "../common/Modal";
// import LogDefinitionEditor from "./LogDefinitionEditor";

// const CpuTempTile: React.FC = () => {
//   const [open, setOpen] = useState(false);

//   return (
//     <>
//       <div
//         style={{
//           background: "var(--surface)",
//           borderRadius: "var(--radius-md)",
//           padding: "var(--space-md)",
//           boxShadow: "var(--shadow-low)",
//           position: "relative",
//         }}
//       >
//         <div
//           style={{
//             position: "absolute",
//             top: "0.4rem",
//             right: "0.4rem",
//           }}
//         >
//           <GearIconButton
//             onClick={() => setOpen(true)}
//             aria-label="Edit CPU temp definition"
//           />
//         </div>

//         <h3 style={{ marginTop: 0 }}>CPU temperature</h3>
//         {/* your current status UI here */}
//       </div>

//       <Modal
//         isOpen={open}
//         onClose={() => setOpen(false)}
//         title="Edit system.cpu.temp"
//       >
//         <LogDefinitionEditor definitionId="system.cpu.temp" />
//       </Modal>
//     </>
//   );
// };

// export default CpuTempTile;
