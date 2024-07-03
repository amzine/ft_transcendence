
export const authHeader = () => {
    let token = "Bearer " + localStorage.getItem("jwtToken");
    let myHeaders = new Headers();
    myHeaders.append("Authorization", token);
    return myHeaders;
  };

export const getLeaderBoard = () => {
    return fetchGet("/get_leaderboard", storeLeaderBoardInfo);
  };
  
  const fetchGet = async (url: string, callback: any) => {
    let fetchUrl = (
      process.env.REACT_APP_BACKEND_SERVER
        ? process.env.REACT_APP_BACKEND_SERVER
        : "http://localhost:5000"
    ) + url;
    try {
      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: authHeader(),
        body: null,
        redirect: "follow",
      });
      const result_1 = await response.json();
      if (!response.ok) {
        return "error";
      }
      return callback(result_1);
    } catch (error) {
      return console.log("error", error);
    }
  };
  export const storeLeaderBoardInfo = (result: any) => {
    return result;
  };