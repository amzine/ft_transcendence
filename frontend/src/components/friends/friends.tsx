import FriendList from "./friendList";
import UserList from "./userList";

export default function Friends() {
    return (
        <div className="w-full h-full grid gridflow-col grid-cols-2 max-[1000px]:flex max-[1000px]:flex-col max-[1000px]:!text-sm overflow-x-hidden overflow-y-scroll">
            <FriendList />
            <UserList />
        </div>
    )
}