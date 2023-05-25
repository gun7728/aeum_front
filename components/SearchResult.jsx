import {useDispatch, useSelector} from "react-redux";
import {useEffect, useState} from "react";
import Image from "next/image";
import * as searchStateAction from "@/store/modules/search";
import * as dataStateAction from "@/store/modules/data";
import styles from '@/styles/search.module.scss'
import {CgPhone} from "react-icons/cg";
import {RiShareForward2Fill} from "react-icons/ri";
import * as alertStateAction from "@/store/modules/alert";
import useSWR from "swr";

export default function SearchResult(){
    const {data:stores} = useSWR('/stores')
    const {data:searchWord} = useSWR('/search/word')

    const dispatch = useDispatch();
    const [results, setResults] = useState([]);
    const [customPoint, setCustomPoint] = useState();

    useEffect(()=>{
        if(searchWord){
            var resultList = [];
            stores.map((e)=>{
                if(JSON.stringify(e.title + ' ' + e.content + ' ' + e.loc).includes(searchWord)){
                    resultList.push(e);
                }
            })
            setResults(resultList)
        }
    },[searchWord])

    const goToDetail =(e)=>{
        dispatch(searchStateAction.listOpen({listOpen:false}))
        dispatch(dataStateAction.setCurDetail({curDetail:Object.values(e)}))
    }

    const copyUrl = (id)=>{
        dispatch(alertStateAction.setAlert({alert:true}))
        dispatch(alertStateAction.setMsg({msg:'URL이 복사되었습니다.'}))
        var url = window.location.href

        navigator.clipboard
            .writeText(url+'share/'+id)
            .then(() => {
                setTimeout(()=>{
                    dispatch(alertStateAction.setAlert({alert:false}))
                    dispatch(alertStateAction.setMsg({msg:null}))
                },1500)
            })
            .catch(() => {
                alert("something went wrong");
            });
    }


    const setStartPoint = async (data)=>{
        dispatch(searchStateAction.searchStart({start:true}))
        dispatch(searchStateAction.pageChange({page:false}))

        await  dispatch(dataStateAction.setStartPoint({startPoint:Object.values(data)}))
        await  dispatch(searchStateAction.listOpen({listOpen:false}))
    }

    const setEndPoint = async (data)=>{
        dispatch(searchStateAction.searchStart({start:true}))
        dispatch(searchStateAction.pageChange({page:false}))

        await dispatch(dataStateAction.setEndPoint({endPoint:Object.values(data)}))
        await dispatch(searchStateAction.listOpen({listOpen:false}))
    }

    const setStartPointCustom = async ()=>{
        console.log(customPoint)
        dispatch(searchStateAction.searchStart({start:true}))
        dispatch(searchStateAction.pageChange({page:false}))

        await  dispatch(dataStateAction.setStartPoint({startPoint:Object.values(customPoint)}))
        await  dispatch(searchStateAction.listOpen({listOpen:false}))
    }
    const setEndPointCustom = async ()=>{
        dispatch(searchStateAction.searchStart({start:true}))
        dispatch(searchStateAction.pageChange({page:false}))

        await dispatch(dataStateAction.setEndPoint({endPoint:Object.values(customPoint)}))
        await dispatch(searchStateAction.listOpen({listOpen:false}))
    }




    useEffect(()=>{
        dispatch(searchStateAction.setSearchData({searchData:results}))
        if(results.length<=0){
            new kakao.maps.services.Geocoder().addressSearch(searchWord,
                (res,status)=>{
                    if (status === kakao.maps.services.Status.OK) {
                        var customPoint = {
                            id:Math.floor(Math.random())+1,
                            title:searchWord,
                            content:searchWord,
                            image:"custom",
                            x:parseFloat(res[0].y),
                            y:parseFloat(res[0].x),
                            category:"custom",
                            loc:"custom",
                        }
                        setCustomPoint(customPoint)
                    }else{
                        setCustomPoint(null);
                    }
                });
        }
    },[results])

    return(
        <div className={styles.searchResultSection}>
            {
                results.length>0?
                    results.map((e)=>{
                        return(
                            <div key={e.id} className={styles.searchListItemSection}>
                                <div className={styles.textSection}>
                                    <span className={styles.title}>
                                        {e.title}
                                    </span>
                                        <span  className={styles.loc}>
                                        {e.loc}
                                    </span>
                                </div>
                                <Image className={styles.searchListItem} src={e.image} alt={`${e.title}`} width={125} height={170} onClick={()=>{goToDetail(e)}}/>
                                <hr style={{marginBottom:'0px', width:'150%',marginLeft:'-20px', opacity:0.3}}/>
                                <div className={styles.detailBtnSection}>
                                    <div style={{float:"left"}}>
                                        <CgPhone className={styles.detailIconBtn}/>
                                        <RiShareForward2Fill className={styles.detailIconBtn} onClick={()=>copyUrl(e.id)}/>
                                    </div>
                                    <div style={{float:"right"}}>
                                        <button className={styles.detailBtn} onClick={()=>setStartPoint(e)}><span style={{color:"gray"}}>출발</span></button>
                                        <button className={styles.detailBtn} onClick={()=>setEndPoint(e)}><span style={{color:"gray"}}>도착</span></button>
                                    </div>
                                </div>
                                <hr style={{marginBottom:'15px', width:'150%',marginLeft:'-20px', opacity:0.3}}/>
                            </div>
                        )
                    })
                    :
                <div className={styles.searchListItemSection}>
                    <div>
                        검색 결과가 없습니다.
                    </div>
                    <br/>
                        {
                            customPoint?
                                <div>
                                    해당 위치를
                                    <button className={styles.detailBtn} onClick={()=>setStartPointCustom()}><span style={{color:"gray"}}>출발</span></button>
                                    <button className={styles.detailBtn} onClick={()=>setEndPointCustom()}><span style={{color:"gray"}}>도착</span></button>
                                    로 지정하시겠습니까?
                                </div>
                            :
                                <div>
                                    잘못된 주소입니다.
                                </div>
                        }
                </div>
            }
        </div>
    )
}
