import React, { useState, useEffect } from "react";
import { PROJECTS } from "./projectsData";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// ProjectLinks: Renders GitHub and Live Site links with pixel-art style and animation
function ProjectLinks({ proj, isClosing }: { proj: any; isClosing: boolean }) {
	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 40 }}
				animate={{ opacity: isClosing ? 0 : 1, y: isClosing ? 40 : 0 }}
				exit={{ opacity: 0, y: 40 }}
				transition={{ duration: isClosing ? 0.3 : 1, delay: isClosing ? 0 : 0.7 }}
				className="flex flex-row flex-wrap gap-4 mt-6"
			>
				<motion.a
					href={proj.github}
					target="_blank"
					rel="noopener noreferrer"
					className="px-6 py-2 bg-primary text-white rounded shadow border-2 border-primary/30 border-pixel"
					style={{ boxShadow: `4px 4px 0 0 #222, 8px 8px 0 0 #000, 0 0 0 4px #fff inset`, imageRendering: 'pixelated' }}
					initial={{ opacity: 0 }}
					animate={{ opacity: isClosing ? 0 : 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: isClosing ? 0.3 : 1, delay: isClosing ? 0.7 : 0.7 }}
				>
					GitHub
				</motion.a>
				{proj.live && (
					<motion.a
						href={proj.live}
						target="_blank"
						rel="noopener noreferrer"
						className="px-6 py-2 bg-secondary text-white rounded shadow border-2 border-secondary/30 border-pixel"
						style={{ boxShadow: `4px 4px 0 0 #222, 8px 8px 0 0 #000, 0 0 0 4px #fff inset`, imageRendering: 'pixelated' }}
						initial={{ opacity: 0 }}
						animate={{ opacity: isClosing ? 0 : 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: isClosing ? 0.3 : 1, delay: isClosing ? 0.7 : 0.7 }}
					>
						Live Site
					</motion.a>
				)}
			</motion.div>
		</AnimatePresence>
	);
}

// ExpandedProjectCard: Handles expanded card rendering, animation, and close logic
function ExpandedProjectCard({ proj, i, isEven, isOpen, isClosing, handleClose }: {
	proj: any;
	i: number;
	isEven: boolean;
	isOpen: boolean;
	isClosing: boolean;
	handleClose: () => void;
}) {
	return createPortal(
		<motion.div
			layoutId={`project-card-${i}`}
			className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col sm:flex-row ${isEven ? "sm:flex-row-reverse" : ""} items-center gap-8 sm:gap-16 w-full max-w-3xl z-50 px-2`}
			style={{ minHeight: 400, background: "none", margin: 0, padding: 0 }}
			transition={{ duration: isOpen && isClosing ? 0.25 : 1.2, type: "tween", ease: "easeInOut" }}
		>
			<motion.div
				layout
				className={`relative flex flex-col sm:flex-row items-center sm:items-stretch gap-8 w-full border-2 border-primary/30 p-8 shadow-pixel sm:w-1/2 rounded-none overflow-hidden border-pixel font-['Press_Start_2P',monospace]`}
				style={{
					boxSizing: "border-box",
					boxShadow: `4px 4px 0 0 #222, 8px 8px 0 0 #000, 0 0 0 4px #fff inset`,
					imageRendering: "pixelated",
					margin: "auto",
					width: "100%",
					maxWidth: 800,
					minHeight: 400,
					background: "none",
				}}
				transition={{ duration: isOpen && isClosing ? 0.25 : 1.2, type: "tween", ease: "easeInOut" }}
			>
				<motion.button
					initial={{ opacity: 0 }}
					animate={{ opacity: isClosing ? 0 : 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: isOpen && isClosing ? 0.25 : 1, type: "tween", ease: "easeInOut" }}
					onClick={handleClose}
					className="absolute top-4 right-4 px-4 py-2 bg-black/70 text-white rounded border border-white hover:bg-black/90 transition z-50"
					style={{ minWidth: 80 }}
				>
					Close
				</motion.button>
				<div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-8 w-full h-full justify-center">
					{isEven ? (
						<>
							<div className="flex-shrink-0 w-full sm:w-64 flex items-center justify-center">
								<motion.img
									layout
									src={proj.img}
									alt={proj.title + " screenshot"}
									className={`rounded border-2 border-primary/30 bg-background shadow-pixel border-pixel object-contain w-full max-w-[256px]`}
									style={{ width: "100%", height: "auto", imageRendering: "pixelated", background: "#222" }}
									transition={{ duration: isOpen && isClosing ? 0.25 : 1.5, type: "tween", ease: "easeInOut" }}
								/>
							</div>
							<div className="flex-1 flex flex-col justify-center min-w-0">
								<motion.h3 layout className="text-lg font-bold mb-4" transition={{ duration: 1.5 }}>
									{proj.title}
								</motion.h3>
								<motion.p layout className="text-sm text-muted-foreground mb-4" transition={{ duration: 1.5 }}>
									{proj.desc}
								</motion.p>
								<ProjectLinks proj={proj} isClosing={isClosing} />
							</div>
						</>
					) : (
						<>
							<div className="flex-1 flex flex-col justify-center min-w-0">
								<motion.h3 layout className="text-lg font-bold mb-4" transition={{ duration: 1.5 }}>
									{proj.title}
								</motion.h3>
								<motion.p layout className="text-sm text-muted-foreground mb-4" transition={{ duration: 1.5 }}>
									{proj.desc}
								</motion.p>
								<ProjectLinks proj={proj} isClosing={isClosing} />
							</div>
							<div className="flex-shrink-0 w-full sm:w-64 flex items-center justify-center">
								<motion.img
									layout
									src={proj.img}
									alt={proj.title + " screenshot"}
									className={`rounded border-2 border-primary/30 bg-background shadow-pixel border-pixel object-contain w-full max-w-[256px]`}
									style={{ width: "100%", height: "auto", imageRendering: "pixelated", background: "#222" }}
									transition={{ duration: isOpen && isClosing ? 0.25 : 1.5, type: "tween", ease: "easeInOut" }}
								/>
							</div>
						</>
					)}
				</div>
			</motion.div>
		</motion.div>,
		document.body
	);
}

export default function ProjectsSection() {
	const [expanded, setExpanded] = useState<number | null>(null);
	const [isClosing, setIsClosing] = useState(false);
	const [showOthers, setShowOthers] = useState(true);

	// Lock scroll when a card is expanded
	useEffect(() => {
		if (expanded !== null) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [expanded]);

	const handleClose = () => {
		setIsClosing(true);
		setShowOthers(true); // Keep others hidden while closing
		setTimeout(() => {
			setExpanded(null);
			setIsClosing(false);
			setTimeout(() => setShowOthers(true), 100); // Show others after card shrinks
		}, 250); // Shrink/close duration now 0.25s
	};

	const handleExpand = (i: number) => {
		setShowOthers(false); // Hide others immediately
		setExpanded(i);
	};

	return (
		<section className="w-full min-h-screen px-0 py-12 relative" id="projects">
			{/* Background pixel sunny image (behind content) */}
			<img
				src="/pixelsunny.png"
				alt="Pixel Sunny Background"
				className="absolute inset-0 w-full h-full object-cover -z-20 select-none pointer-events-none"
				draggable={false}
				style={{ imageRendering: "pixelated", objectPosition: "bottom" }}
			/>
			{/* Dark overlay for contrast */}
			<div className="absolute inset-0 bg-black/40 -z-10 pointer-events-none" />

			<div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center relative z-10 px-4">
				<h2 className="text-2xl font-semibold mb-10 text-center">Projects</h2>
				<div className="flex flex-col gap-16 w-full">
					{PROJECTS.map((proj, i) => {
						const isEven = i % 2 === 1;
						const isOpen = expanded === i;
						const isFaded = expanded !== null && expanded !== i && !isOpen && !isClosing && !showOthers;

						if (isOpen) {
							// Placeholder keeps layout stable
							return <React.Fragment key={i}>
								<div style={{ height: 0, minHeight: 0, margin: 0, padding: 0, visibility: "hidden" }} aria-hidden="true" />
								<ExpandedProjectCard
									proj={proj}
									i={i}
									isEven={isEven}
									isOpen={isOpen}
									isClosing={isClosing}
									handleClose={handleClose}
								/>
							</React.Fragment>;
						}

						// Non-expanded card rendering
						return (
							<React.Fragment key={i}>
								<motion.div
									layoutId={`project-card-${i}`}
									className={`flex flex-col sm:flex-row ${isEven ? "sm:flex-row-reverse" : ""} items-center gap-8 sm:gap-16 w-full relative z-10`}
									style={{
										cursor: isOpen ? "default" : "pointer",
										opacity: isFaded ? 0 : 1,
										pointerEvents: isFaded ? "none" : undefined,
									}}
									animate={{ opacity: isFaded ? 0 : 1 }}
									transition={{
										layout: { duration: 0.6, type: "tween", ease: "easeInOut" },
										opacity: { duration: 1.2, ease: "easeInOut" },
									}}
									onClick={() => !isOpen && handleExpand(i)}
								>
									{/* Per-card overlay when another card is expanded */}
									<AnimatePresence>
										{expanded !== null && !isOpen && !isFaded && (
											<motion.div
												initial={{ opacity: 0 }}
												animate={{ opacity: 0.7 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.5, ease: "easeInOut" }}
												className="absolute inset-0 bg-black z-30 pointer-events-none rounded-none"
											/>
										)}
									</AnimatePresence>
									<motion.div
										layout
										className={`relative flex flex-col sm:flex-row items-center sm:items-stretch gap-8 w-full border-2 border-primary/30 p-8 shadow-pixel sm:w-1/2 rounded-none overflow-hidden border-pixel`}
										style={{
											boxSizing: "border-box",
											boxShadow: `4px 4px 0 0 #222, 8px 8px 0 0 #000, 0 0 0 4px #fff inset`,
											imageRendering: "pixelated",
											margin: undefined,
											background: "none",
										}}
										transition={{ duration: 0.6, type: "tween", ease: "easeInOut" }}
									>
										<div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-8 w-full h-full justify-center">
											{isEven ? (
												<>
													<div className="flex-shrink-0 w-full sm:w-64 flex items-center justify-center">
														<motion.img
															layout
															src={proj.img}
															alt={proj.title + " screenshot"}
															className={`rounded border-2 border-primary/30 bg-background shadow-pixel border-pixel object-contain w-full max-w-[256px]`}
															style={{ width: "100%", height: "auto", imageRendering: "pixelated", background: "#222" }}
															transition={{ duration: 1.5, type: "tween", ease: "easeInOut" }}
														/>
													</div>
													<div className="flex-1 flex flex-col justify-center min-w-0">
														<motion.h3 layout className="text-lg font-bold mb-4" transition={{ duration: 1.5 }}>
															{proj.title}
														</motion.h3>
														<motion.p layout className="text-sm text-muted-foreground mb-4" transition={{ duration: 1.5 }}>
															{proj.desc}
														</motion.p>
													</div>
												</>
											) : (
												<>
													<div className="flex-1 flex flex-col justify-center min-w-0">
														<motion.h3 layout className="text-lg font-bold mb-4" transition={{ duration: 1.5 }}>
															{proj.title}
														</motion.h3>
														<motion.p layout className="text-sm text-muted-foreground mb-4" transition={{ duration: 1.5 }}>
															{proj.desc}
														</motion.p>
													</div>
													<div className="flex-shrink-0 w-full sm:w-64 flex items-center justify-center">
														<motion.img
															layout
															src={proj.img}
															alt={proj.title + " screenshot"}
															className={`rounded border-2 border-primary/30 bg-background shadow-pixel border-pixel object-contain w-full max-w-[256px]`}
															style={{ width: "100%", height: "auto", imageRendering: "pixelated", background: "#222" }}
															transition={{ duration: 1.5, type: "tween", ease: "easeInOut" }}
														/>
													</div>
												</>
											)}
										</div>
									</motion.div>
								</motion.div>
							</React.Fragment>
						);
					})}
				</div>
			</div>
		</section>
	);
}

// TailwindCSS custom animation for fade-in delay
// Add this to your global CSS if not present:
// .animate-fade-in-delay { animation: fadeIn 0.7s 0.4s forwards; opacity: 0; }
// @keyframes fadeIn { to { opacity: 1; } }
