import Nav from "@/component/nav/Nav";
import { requestWithAuth } from "@/lib/utils/request";
import { ApiList } from "auction-shared/api"

export default async function Page() {
  // const { data: result } = await requestWithAuth<ApiList['user']>('https://ddjejmwwrb.execute-api.ap-south-1.amazonaws.com/prod/get-user');
  // console.log(result.user.balance)
  return (
    <div>
      <Nav></Nav>
      home page
    </div>
  )
}