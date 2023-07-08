import React from "react";
import Navbar from "../Components/navbar";
import MyChats from "../Components/mychats";
import ChatBox from '../Components/Chatbox';

export default function Home() {

    return (
        <>
            <Navbar />
            <div className="container-fluid px-3 py-4 " style={{ height: "100%" }}>
                <div className="row d-flex justify-content-evenly">
                    <MyChats />
                    <ChatBox />
                </div>
            </div >
        </>
    );
}