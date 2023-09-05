const Avatar = ({ userId, username, online }) => {
  const colors = [
    "bg-red-200",
    "bg-green-200",
    "bg-purple-200",
    "bg-blue-200",
    "bg-yellow-200",
    "bg-teal-200",
  ];
  const userIdBase19 = parseInt(userId, 16);
  const colorIndex = userIdBase19 % colors.length;
  const color = colors[colorIndex];
  return (
    <div
      className={
        "flex relative items-center w-8 h-8 bg-red-200 rounded-full " + color
      }
    >
      <div className="w-full text-center opacity-70">
        {username && username[0]}
      </div>
      {online && (
        <div className="absolute w-2 h-2 bottom-[2px] right-0 bg-green-500 rounded-full"></div>
      )}
    </div>
  );
};

export default Avatar;
