"use client";
import { CloseIcon } from "@/components/CloseIcon";
import { NoAgentNotification } from "@/components/NoAgentNotification";
import TranscriptionView from "@/components/TranscriptionView";
import {
    BarVisualizer,
    DisconnectButton,
    RoomAudioRenderer,
    RoomContext,
    VideoTrack,
    VoiceAssistantControlBar,
    useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import type { ConnectionDetails } from "./api/connection-details/route";

export default function Page() {
    const [room] = useState(new Room());
    const onConnectButtonClicked = useCallback(async () => {
        const url = new URL(
            process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
            window.location.origin
        );
        const response = await fetch(url.toString());
        const connectionDetailsData: ConnectionDetails = await response.json();
        await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
        await room.localParticipant.setMicrophoneEnabled(true);
    }, [room]);
    useEffect(() => {
        room.on(RoomEvent.MediaDevicesError, onDeviceFailure);
        return () => {
            room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
        };
    }, [room]);
    return (
        <main data-lk-theme="default" className="h-full min-h-screen grid content-center bg-gradient-to-br from-red-100 via-white to-red-200">
            <RoomContext.Provider value={room}>
                <div className="lk-room-container max-w-[1024px] w-[90vw] mx-auto max-h-[90vh] bg-white/80 rounded-2xl shadow-2xl border border-red-300 backdrop-blur-md">
                    {/* Custom welcome message */}
                    <div className="mb-4 text-center pt-8">
                        <h1 className="text-4xl font-extrabold text-red-700 tracking-tight drop-shadow">Toronto Travel Guide Assistant</h1>
                        <p className="text-lg mt-2 text-red-600">Ask for tips on attractions, food, transit, and more!</p>
                    </div>
                    <SimpleVoiceAssistant onConnectButtonClicked={onConnectButtonClicked} />
                </div>
            </RoomContext.Provider>
        </main>
    );
}

function SimpleVoiceAssistant(props: { onConnectButtonClicked: () => void }) {
    const { state: agentState } = useVoiceAssistant();
    return (
        <>
            <AnimatePresence mode="wait">
                {agentState === "disconnected" ? (
                    <motion.div
                        key="disconnected"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
                        className="grid items-center justify-center h-full"
                    >
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="uppercase px-6 py-3 bg-red-700 text-white rounded-lg shadow hover:bg-red-800 transition"
                            onClick={() => props.onConnectButtonClicked()}
                        >
                            Ask about Toronto!
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="connected"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
                        className="flex flex-col items-center gap-4 h-full"
                    >
                        <AgentVisualizer />
                        <div className="flex-1 w-full">
                            <TranscriptionView />
                        </div>
                        <div className="w-full">
                            <ControlBar onConnectButtonClicked={props.onConnectButtonClicked} />
                        </div>
                        <RoomAudioRenderer />
                        <NoAgentNotification state={agentState} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function AgentVisualizer() {
    const { state: agentState, videoTrack, audioTrack } = useVoiceAssistant();
    if (videoTrack) {
        return (
            <div className="h-[320px] w-[320px] rounded-xl overflow-hidden border-4 border-red-300 shadow-lg bg-red-50">
                <VideoTrack trackRef={videoTrack} />
            </div>
        );
    }
    return (
        <div className="h-[200px] w-full flex items-center justify-center">
            <BarVisualizer
                state={agentState}
                barCount={5}
                trackRef={audioTrack}
                className="agent-visualizer"
                options={{ minHeight: 24 }}
            />
        </div>
    );
}

function ControlBar(props: { onConnectButtonClicked: () => void }) {
    const { state: agentState } = useVoiceAssistant();
    return (
        <div className="relative h-[60px]">
            <AnimatePresence>
                {agentState === "disconnected" && (
                    <motion.button
                        initial={{ opacity: 0, top: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, top: "-10px" }}
                        transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
                        className="uppercase absolute left-1/2 -translate-x-1/2 px-6 py-3 bg-red-700 text-white rounded-lg shadow hover:bg-red-800 transition"
                        onClick={() => props.onConnectButtonClicked()}
                    >
                        Start a conversation
                    </motion.button>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {agentState !== "disconnected" && agentState !== "connecting" && (
                    <motion.div
                        initial={{ opacity: 0, top: "10px" }}
                        animate={{ opacity: 1, top: 0 }}
                        exit={{ opacity: 0, top: "-10px" }}
                        transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
                        className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center"
                    >
                        <VoiceAssistantControlBar controls={{ leave: false }} />
                        <DisconnectButton>
                            <CloseIcon />
                        </DisconnectButton>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function onDeviceFailure(error: Error) {
    console.error(error);
    alert(
        "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
    );
}