'use client'
import useMap from "@/hooks/useMap";
import Map from "@/components/Map";
import useStores from "@/hooks/useStores";
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import useSWR from "swr";
import {useEffect} from "react";
import useLoading from "@/hooks/useLoading";
// import axios from "axios";

export default function KakaoMap(){

    const { initializeStores, nearStores,setChoseStore } = useStores();
    const {setLoading} = useLoading();
    const { initializeMap, initializeCurrentPosition,initializeCurrentLocation, allStoresMarker,screenMarker,positionChange  } = useMap();

    const { data:stores } = useSWR('/stores');
    const { data:choseStore } = useSWR('/stores/chose');
    const { data:map } = useSWR('/map');
    const { data:route } = useSWR('/map/route');
    const { data:allMarker } = useSWR('/map/all/marker');
    const { data:bound } = useSWR('/map/bound');
    const { data:zoom } = useSWR('/map/zoom');
    const { data:center } = useSWR('/map/center');
    const { data:sMarker } = useSWR('/map/screen/marker')
    const { data:changedPosition } = useSWR('/map/position/change')

    const onLoadMap = async (map) => {
        getPosition(map)
        initializeMap(map);
        initData();
    };


    const initData = async ()=>{
        return new Promise((resolve) => {
            fetch(`/tourApi/areaBasedSyncList1?serviceKey=${process.env.TOUR_API_ECD_KEY}&numOfRows=20000&pageNo=1&MobileOS=ETC&MobileApp=Aeum&_type=json&showflag=1&listYN=Y&arrange=A&contentTypeId=12`)
                .then(function(response){
                    return response.json()
                }).then(function(data) {
                    var datas = data.response.body.items.item

                    let markerList = [];
                    for(var i =0, max=datas.length; i<max; i++){
                        if(!datas[i].firstimage){
                            datas[i].firstimage = '/noimage.png'
                        }
                        if(!datas[i].firstimage2){
                            datas[i].firstimage2 = '/noimage.png'
                        }

                        const marker = new kakao.maps.Marker({
                            title: i,
                            position: new kakao.maps.LatLng(datas[i].mapy,datas[i].mapx),
                        });

                        markerList.push(marker);
                    }


                    allStoresMarker(markerList);
                    initializeStores(datas);
                    // nearbyStores();
                    resolve()
            }).catch(err => console.error(err));
        })
    };

    const initPosition = (position) => {
        initializeCurrentPosition(position)
    }

    useEffect(()=>{
        if(!bound || !allMarker || !stores || !map || route || !changedPosition || !center)
            return

        new kakao.maps.services.Geocoder().coord2Address(center.La,center.Ma,
        (res,status)=>{
            if (status === kakao.maps.services.Status.OK) {
                initializeCurrentLocation(res[0].address.region_2depth_name)
            }
        });

        if(sMarker){
            sMarker.map((mk)=>{
                mk.setMap(null)
            })
        }

        const boundsChange = [];
        const markers = [];


        var size = bound;

        if(zoom<=4){
            size.ha+=-0.00248;
            size.oa+=0.00189;
            size.pa+=0.00536;
            size.qa+=-0.00473
        }

        allMarker.map((marker)=>{
            if (size.contain(marker.getPosition()) == true) {
                var data = stores[`${marker.getTitle()}`];
                boundsChange.push(data)

                var mk = new kakao.maps.Marker({
                    position: new kakao.maps.LatLng(data.mapy,data.mapx),
                    map:map
                });


                kakao.maps.event.addListener(mk, 'click', function() {
                    setLoading(true);
                    fetch(`/tourApi/detailCommon1?serviceKey=${process.env.TOUR_API_ECD_KEY}&MobileOS=ETC&MobileApp=Aeum&_type=json&contentId=${data.contentid}&contentTypeId=12&defaultYN=Y&firstImageYN=Y&areacodeYN=Y&catcodeYN=Y&addrinfoYN=Y&mapinfoYN=Y&overviewYN=Y&numOfRows=10&pageNo=1`)
                        .then(function(response){
                            return response.json()
                        }).then(async function(data) {
                        var datas = data.response.body.items.item[0]

                        if(choseStore)
                            await setChoseStore(null);

                        setChoseStore(datas)
                    });
                });

                markers.push(mk);
            }
        })

        positionChange(false);
        screenMarker(markers);
        nearStores(boundsChange)

    },[bound,allMarker,stores,map,zoom,route,changedPosition,center])


    // const nearbyStores = () => {
    //     if(!stores)
    //         return
    //
    //     var nearStore = stores.filter((data) => {
    //         const getDistanceFromLatLonInKm = (lat1, lng1, lat2, lng2) => {
    //             function deg2rad(deg) {
    //                 return deg * (Math.PI / 180)
    //             }
    //
    //             var R = 6371; // Radius of the earth in km
    //             var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    //             var dLon = deg2rad(lng2 - lng1);
    //             var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    //             var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //             var d = R * c; // Distance in km
    //             return d;
    //         }
    //
    //         // 반경 내에 있는지 검사합니다.
    //         const distance = getDistanceFromLatLonInKm(my, mx, data.mapy, data.mapx);
    //         return distance <= 3;
    //     })
    // };

    // useEffect(()=>{
    //     if(!center)
    //         return
    //
    //     new kakao.maps.services.Geocoder().coord2Address(center.La,center.Ma,
    //     (res,status)=>{
    //         if (status === kakao.maps.services.Status.OK) {
    //             initializeCurrentLocation(res[0].address.region_2depth_name)
    //         }
    //     });
    //
    // },[center])

    const getPosition = (map) =>{
        navigator.geolocation.getCurrentPosition(async (position) => {
            map.panTo(new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude))

            initPosition([position.coords.latitude, position.coords.longitude])
            // var marker = new kakao.maps.Marker({
            //     position: new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude)
            // });

            new kakao.maps.services.Geocoder().coord2Address(position.coords.longitude,position.coords.latitude,
                (res,status)=>{
                if (status === kakao.maps.services.Status.OK) {
                    initializeCurrentLocation(res[0].address.region_2depth_name)
                }
            });

            marker.setMap(map);

        },( )=>{
            var lat = 37.57861
            var lng = 126.97722
            map.panTo(new kakao.maps.LatLng(lat, lng))

            initPosition([lat, lng])
            // var marker = new kakao.maps.Marker({
            //     position: new kakao.maps.LatLng(lat, lng)
            // });

            new kakao.maps.services.Geocoder().coord2Address(lng,lat,
            (res,status)=>{
                if (status === kakao.maps.services.Status.OK) {
                    initializeCurrentLocation(res[0].address.region_2depth_name)
                }
            });

            // marker.setMap(map);
        });

    }
    //




    return(
        <>
            <Map
                onLoad={onLoadMap}
            />
        </>
    )
}
