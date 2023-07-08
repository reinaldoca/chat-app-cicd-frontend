import React, { useEffect, useState } from "react";
import { useAppStates } from "../AppContext/Provider";
import { BsFillEyeFill, BsFillSendFill } from 'react-icons/bs';
import { MdOutlineKeyboardBackspace } from 'react-icons/md';
import { getSender, isSameSenderMargin, isSameUser, isLastMessage, isSameSender } from '../ChatLogic';
import UserComponent from "./usercomponent";
import { toast } from "react-toastify";
import axios from "axios";
import Scrollable from 'react-scrollable-feed';
import envConfig from '../EnvConfig';


export default function ChatBox() {
    const [GroupName, SetGroupName] = useState('');
    const [UserName, SetUserName] = useState('');
    const [searchresult, setsearchresult] = useState([]);
    const { user, selectedchats, setselectedchats } = useAppStates();

    const [content, setcontent] = useState('');
    const [AllMessages, SetAllMessages] = useState([]);

    const handleUserSearch = async (e) => {
        e.preventDefault();
        if (!UserName) {
            toast.error('Please enter username or email to search.');
            return
        }
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
            const { data } = await axios.get(`${envConfig.keyChangeUrl}/api?search=${UserName}`, config);
            setsearchresult(data.users)
        } catch (error) {
            console.log(error);
            toast.error("Failed to find users.");
        }
    }

    const handleAddition = async (newuser) => {
        if (selectedchats.groupAdmin._id === user.user._id) {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
                const { data } = await axios.put(`${envConfig.keyChangeUrl}/api/chats/groupadd`,
                    {
                        chatid: selectedchats._id,
                        userid: newuser._id
                    },
                    config
                );
                toast.info('User Added Successfully.');
                setselectedchats(data);
            } catch (error) {
                toast.error('Failed to Add new user to group');
            }
        }
        else {
            toast.error('Only Admins Update Group Chat');
        }
    }

    const HandleRemove = async (UsertoRemove) => {
        if (selectedchats.groupAdmin._id === user.user._id) {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
                const { data } = await axios.put(`${envConfig.keyChangeUrl}/api/chats/group/remove`,
                    {
                        chatid: selectedchats._id,
                        userid: UsertoRemove._id
                    },
                    config
                );
                toast.info("User Removed Successfully.");
                setselectedchats(data);
                FetchAllMessages();
            } catch (error) {
                toast.error('Failed to Remove user from group');
            }
        }
        else {
            toast.error('Only Admins Update Group Chat');
        }
    }

    const handleNameChange = async () => {
        if (GroupName === '') {
            toast.error('Enter a valid Group Name')
            return
        }
        if (selectedchats.groupAdmin._id !== user.user._id) {
            toast.error('Only Admin can Update Group Chat.')
            return
        }
        else {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
                const { data } = await axios.put(`${envConfig.keyChangeUrl}/api/chats/rename`,
                    {
                        chatid: selectedchats._id,
                        UpdatedChatname: GroupName
                    },
                    config
                );
                toast.info('Group Chat Renamed Successfully.');
                SetGroupName('')
                setselectedchats(data);
            } catch (err) {
                toast.error('Failed to Update Group Chat.')
            }
        }
    }

    const HandleExit = async (UserID) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
            const { data } = await axios.put(`${envConfig.keyChangeUrl}/api/chats/group/exit`,
                {
                    chatid: selectedchats._id,
                    userid: UserID
                },
                config
            );
            toast.info(data.message);
            setselectedchats();
        } catch (error) {
            toast.error('Failed to Remove user from group');
        }
    }


    const FetchAllMessages = async () => {
        if (!selectedchats) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.get(
                `${envConfig.keyChangeUrl}/api/message/${selectedchats._id}`,
                config
            );
            SetAllMessages(data);
        } catch (error) {
            toast.error('Fetching all Messages Failed !');
        }
    }

    const HandleSendMessage = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };
            setcontent('');
            const { data } = await axios.post(`${envConfig.keyChangeUrl}/api/message`,
                {
                    content: content,
                    chatID: selectedchats._id,
                },
                config
            );
            SetAllMessages([...AllMessages, data])
        } catch (error) {
            toast.error('Failed to Deliver Message !');
        }
    }

    useEffect(() => {
        FetchAllMessages();

    }, [selectedchats]);

    return (
        <>
            <div className="modal" id="UserProfileModal">
                <div className="modal-dialog modal-dialog-centered">
                    {user && selectedchats &&

                        <div className="modal-content">
                            <div className="modal-header">
                                <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    onClick={() => { setsearchresult([]); SetUserName('') }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {
                                    (selectedchats.isGroupChat)
                                        ?
                                        <h4 className="mb-0"><strong>{selectedchats.ChatName}</strong></h4>
                                        :
                                        ""
                                }
                                {
                                    (!selectedchats.isGroupChat)
                                        ?
                                        <div className="d-flex flex-column justify-content-center align-items-center">
                                            <img
                                                src={getSender(user, selectedchats.users).avatar}
                                                width='150px'
                                                height="auto"
                                                alt="profile."
                                            />
                                            <h4 className="mt-2 mb-0"><strong>{getSender(user, selectedchats.users).name}</strong></h4>
                                            <p className='my-2' style={{ fontSize: "1.2rem" }}>{getSender(user, selectedchats.users).email}</p>
                                        </div>
                                        :
                                        <>
                                            <p className="mt-2 mb-0">All Members</p>
                                            {selectedchats.users.map((user) => {
                                                return (
                                                    <span
                                                        key={user._id}
                                                        className="badge p-2 m-1"
                                                    >
                                                        {user.name}
                                                        <button
                                                            type="button"
                                                            className="btn btn-close btn-close-white ms-2"
                                                            style={{ width: "5px", height: "6px" }}
                                                            onClick={() => HandleRemove(user)}
                                                        ></button>
                                                    </span>
                                                )
                                            })}
                                            <input
                                                type="text"
                                                className="form-control mt-2 mb-1 styled"
                                                placeholder="Group Name"
                                                value={GroupName}
                                                required
                                                name="GroupName"
                                                onChange={(e) => SetGroupName(e.target.value)}
                                            />

                                            <form onSubmit={handleUserSearch}>
                                                <input
                                                    type="text"
                                                    className="form-control styled"
                                                    name="UserName"
                                                    placeholder="Search Users"
                                                    value={UserName}
                                                    onChange={(e) => SetUserName(e.target.value)}
                                                />
                                            </form>
                                            <div className="mt-2">
                                                {
                                                    searchresult && searchresult.map(user => {
                                                        return (
                                                            <UserComponent
                                                                avatar={user.avatar}
                                                                key={user._id}
                                                                username={user.name}
                                                                email={user.email}
                                                                handleFunction={() => handleAddition(user)}
                                                            />
                                                        );
                                                    })
                                                }
                                            </div>
                                        </>
                                }
                            </div>

                            <div className="modal-footer">
                                {!selectedchats.isGroupChat
                                    ?
                                    <button className="btn StyledButton" data-bs-dismiss="modal">close</button>
                                    :
                                    <>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => HandleExit(user.user._id)}
                                        >Exit</button>
                                        <button
                                            className="btn btn-success"
                                            onClick={handleNameChange}
                                        >Rename</button>
                                    </>
                                }
                            </div>
                        </div>
                    }
                </div>
            </div>

            <div
                className={
                    (!selectedchats)
                        ?
                        "d-none d-md-flex col-md-7 col-xl-8 ChatBox"
                        :
                        "col-md-7 col-xl-8 ChatBox"
                }
            >
                {selectedchats
                    ?
                    <div className="row h-100">
                        <div
                            className="col-12 d-flex justify-content-evenly align-items-center ChatBoxOpeningWrapper"
                            style={{ height: "60px" }}
                        >
                            <button
                                className="btn btn-sm btn-light me-3 d-md-none"
                                onClick={() => setselectedchats()}
                            >
                                <MdOutlineKeyboardBackspace size={20} />
                            </button>
                            {
                                (selectedchats.isGroupChat)
                                    ?
                                    <h4 className="mb-0 flex-grow-1"><strong>{selectedchats.ChatName}</strong></h4>
                                    :
                                    <h4 className="mb-0 flex-grow-1"><strong>{getSender(user, selectedchats.users).name}</strong></h4>
                            }
                            <button
                                className="btn btn-sm btn-light"
                                data-bs-toggle="modal"
                                data-bs-target="#UserProfileModal"
                            >
                                <BsFillEyeFill />
                            </button>
                        </div>



                        <div className="MessageBox">

                            <Scrollable className="pb-1">
                                {
                                    AllMessages && AllMessages.map((message, i) => {
                                        return (
                                            <div
                                                key={message._id}
                                                style={{
                                                    display: "flex",
                                                    marginTop: `${isSameUser(AllMessages, message, i, user.user._id) ? "1px" : "15px"}`
                                                }}
                                            >
                                                {(isSameSender(AllMessages, message, i, user.user._id) ||
                                                    isLastMessage(AllMessages, i, user.user._id)) && (
                                                        <img
                                                            key={message.sender.avatar}
                                                            alt="user_avatar"
                                                            width={"35px"}
                                                            name={message.sender.name}
                                                            src={message.sender.avatar}
                                                        />
                                                    )}
                                                <span
                                                    key={message.content}
                                                    style={{
                                                        alignSelf: `${message.sender._id !== user.user._id ? "start" : "end"}`,
                                                        backgroundColor: `${message.sender._id === user.user._id ? "#39B5E0" : "#DBE2E9"}`,
                                                        borderRadius: "5px",
                                                        marginLeft: isSameSenderMargin(AllMessages, message, i, user.user._id),
                                                        padding: "5px 15px",
                                                        color: `${message.sender._id === user.user._id ? "#fff" : "#000"}`,
                                                        fontWeight: "bold"
                                                    }}
                                                >
                                                    {message.content}
                                                </span>

                                            </div>
                                        )
                                    })
                                }
                            </Scrollable>
                        </div>

                        <form class="d-flex FormBox py-2" onSubmit={HandleSendMessage}>
                            <input
                                type="text"
                                class="form-control me-2"
                                id="MessageInput"
                                placeholder="Send Message"
                                value={content}
                                required
                                onChange={(e) => setcontent(e.target.value)}
                            />
                            <button type="submit" class="btn d-inline-flex StyledButton">
                                <BsFillSendFill size={22} color="white" />
                            </button>
                        </form>
                    </div>
                    :
                    <div className="row d-flex align-items-center w-100">
                        <h5 className="text-center mb-0">Select a user to chat</h5>
                    </div>
                }
            </div >
        </>

    );
}