'use client'
import Image from "next/image";
import styles from "@/styles/header.module.scss";
import {useEffect, useState} from "react";
import {CgPhone} from "react-icons/cg";
import {RiShareForward2Fill} from "react-icons/ri";
import {
    IoEarthOutline,
    IoInformation,
    IoInformationCircle,
    IoInformationOutline, IoInformationSharp,
    IoLocationOutline,
    IoPencil
} from "react-icons/io5";
import {BsPencil} from "react-icons/bs";
import useSWR from "swr";
import useAlert from "@/hooks/useAlert";
import useStores from "@/hooks/useStores";
import useMap from "@/hooks/useMap";
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import useLoading from "@/hooks/useLoading";

export default function BottomSpotDetail(){
    const {setAlertStart,setAlertMsg} = useAlert()
    const {setStartStore,setEndStore,setSearchMarker} = useMap()
    const {setLoading} = useLoading()

    const {data:map} = useSWR('/map')
    const {data:choseStore} = useSWR('/stores/chose')
    const { data:nearStores } = useSWR('/stores/near');

    const [getImg, setGetImg] = useState([]);

    const tooLongText =(text)=>{
        if(!text)
            return

        var newText;
        if(text.length>50){
            newText = String(text).substring(0,50) + '...';
        }else{
            newText =text;
        }

        return newText;
    }
    const copyData = (info,type)=>{
        setAlertStart(true)
        setAlertMsg(type==='id'?'URL이 복사되었습니다.':<span>전화번호가 복사되었습니다.<br/>{info}</span>)
        var url = window.location.href

        navigator.clipboard
            .writeText(type==='id'?url+'share/'+info:info)
            .then(() => {
                setTimeout(()=>{
                    setAlertStart(false)
                    setAlertMsg(null)
                },1500)
            })
            .catch(() => {
                alert("something went wrong");
            });
    }

    useEffect(()=>{
        if(!choseStore && !map) return

        new Promise((resolve => {
            fetch(`/tourApi/detailImage1?serviceKey=${process.env.TOUR_API_ECD_KEY}&MobileOS=ETC&MobileApp=Aeum&_type=json&contentId=${choseStore.contentid}&imageYN=Y&subImageYN=Y&numOfRows=10&pageNo=1`)
            .then(function(response){
                return response.json()
            }).then(function(data) {
                var datas = data.response.body.items.item
                const imgList = [];

                if(datas){
                    datas.map((info)=>{
                        imgList.push(info.smallimageurl);
                    })
                }

                setGetImg(imgList);
                setLoading(false)

                if(map){
                    map.setLevel(3,true)
                    map.panTo(new kakao.maps.LatLng(choseStore.mapy-0.002,choseStore.mapx));

                    let choseFlag = false;
                    nearStores.map((e)=>{
                        if(e.contentid === choseStore.contentid){
                            choseFlag = true;
                        }
                    })
                    if(!choseFlag){
                        var mk = new kakao.maps.Marker({
                            position: new kakao.maps.LatLng(choseStore.mapy,choseStore.mapx),
                            map:map,
                        });
                        setSearchMarker(mk);
                    }

                    return  ()=> {
                        if(mk){
                            mk.setMap(null);
                        }

                    }
                }

            });
            resolve()
        }))

    },[choseStore,map])
    const typeIcons = (id) =>{
        var loc = '';
        // 12:관광지(tours), 14:문화시설, 15:축제공연행사, 25:여행코스, 28:레포츠, 32:숙박, 38:쇼핑, 39:음식점
        switch(String(id)){
            case '12':
                loc = '/icons/tours.png'
                break;
            case '14':
                loc = '/icons/astrology.png'
                break;
            case '15':
                loc = '/icons/concerts.png'
                break;
            case '25':
                loc = '/icons/automotive.png'
                break;
            case '28':
                loc = '/icons/sporting-goods.png'
                break;
            case '32':
                loc = '/icons/hotels.png'
                break;
            case '38':
                loc = '/icons/shopping.png'
                break;
            case '39':
                loc = '/icons/food.png'
                break;
        }
        var icon=  new kakao.maps.MarkerImage(
            loc,
            new kakao.maps.Size(31, 40));
        return icon
    }
    const setStartPoint = (data)=>{
        setStartStore(data)
    }

    const setEndPoint = (data)=>{
        setEndStore(data)
    }
    const clickImg = () =>{
        console.log('??')
    }

    return(
        <div>
            {
                choseStore?
                    <div>
                        <div className={styles.detailTitleSection}>
                            <h2 className={styles.detailTitle} >
                                {choseStore.title}
                            </h2>
                            {/*<h4 style={{opacity:0.5}}>{choseStore[13]}</h4>*/}
                        </div>
                        <div className={styles.detailBtnSection}>
                            <div style={{float:"left"}}>
                                {
                                    choseStore.tel?
                                    <>
                                        <CgPhone className={styles.detailIconBtn} onClick={()=>copyData(choseStore.tel,'tel')}/><span style={{position: 'absolute',paddingTop:' 5px'}}>{choseStore.tel}</span>
                                    </>
                                    :
                                    <><span style={{position: 'absolute',paddingTop:' 5px'}}>전화 번호 정보가 없습니다.</span></>
                                }
                                {/*<RiShareForward2Fill className={styles.detailIconBtn} onClick={()=>copyData(choseStore.contentid,'id')}/>*/}
                            </div>
                            <div style={{float:"right"}}>
                                <button className={styles.detailBtn} onClick={()=>setStartPoint(choseStore)}><span style={{color:"gray"}}>출발</span></button>
                                <button className={styles.detailBtn} onClick={()=>setEndPoint(choseStore)}><span style={{color:"gray"}}>도착</span></button>
                            </div>
                        </div>
                        <hr style={{marginBottom:'15px', width:'150%',marginLeft:'-20px', opacity:0.3}}/>


                        <div className={styles.detailContentScrollSection}>
                            <div style={{height:'150px'}}>
                                <div className={styles.detailContentSection}>
                                    <IoLocationOutline className={styles.detailIcon}/>
                                    <div>
                                        <span className={styles.detailContent}>{choseStore.addr1}</span>
                                        <br/>
                                        <span className={styles.detailContent}>{choseStore.zipcode}</span>
                                    </div>
                                </div>

                                <div className={styles.detailContentSection}>
                                    <IoEarthOutline  className={styles.detailIcon}/>
                                    <div dangerouslySetInnerHTML={{__html: choseStore.homepage}} className={styles.detailUrl}/>
                                </div>

                                <div className={styles.detailContentSection}>
                                    <IoInformationSharp  className={styles.detailIcon}/>
                                    <span className={styles.detailContent} >{choseStore.overview}</span>
                                </div>
                            </div>
                            <hr style={{marginBottom:'15px', width:'150%',marginLeft:'-20px', opacity:0.3}}/>
                            <div style={{alignItems: 'center', justifyContent: 'flex-start',overflowX: 'scroll',display:'flex'}} >
                                {
                                    getImg.length>0?
                                    getImg.map((img,idx)=>{
                                        return <img key={idx} alt={choseStore.title} className={styles.detailInnerThumb} src={img} width={150} height={150} onClick={()=>{clickImg()}}/>
                                    })
                                        :
                                        <div>이미지가 없습니다.</div>
                                }
                            </div>
                        </div>
                    </div>
                    :
                    <></>
            }
        </div>
    )
}
