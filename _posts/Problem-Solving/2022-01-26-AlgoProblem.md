---
layout: post
title: 입국 심사(프로그래머스 LV.2)
author: Yoo Chang Heon
tags: [Algorithm, Problem-Solving]
---

## 프로그래머스

### Lv2. 입국 심사

&ensp;

&nbsp;값이 10억이상이면 로그시간= 이진탐색

times=> 선형 로그 시간으로도 충분히 가능.

but 우리는 특정 값을 찾는 것이 아님.

==> 우리가 찾는 것은 ' 최소 몇 분에 모든 심사가 끝나는가? ' 이다.

ㄴ 결정문제 => 이진탐색 = 파라메트릭 서치 (Parametric Search)

최소 1분에서 10억분 x n 시간 사이에 답이 있음.

면접관들이 몇명을 처리하는가?

처리 가능한 입국자 n보다 작다면 분을 올려야하고, 입국자가 n보다 크다면 분을 낮춰야 한다.

면접관이 시간대비 몇명을 처리할 수 있는가를 알아야함.

시간/심사시간\*심사관 당 처리가능한 입국자 수

## 코드

    function solution(n, times){
        const sortedTimes= times.sort((a,b)=>a-b); // O(nlogn)
        let left=1; //1분부터(가장 빠르게 처리하는 속도)
        let right=sortedTimes[sortedTimes.length-1]*n;//가장 느리게 처리하는 속도
        while(left<=right){
            const mid= Math.floor((left+right)/2);
            const sum=times.reduce((acc,time)=> acc+ Math.floor(mid/time),0); // sum= [시간/심사시간]
            if(sum<n){
                left= mid+1;
            }else{
                right=mid-1;
            }
        }
        return left;
    }

가장 빨리~ 가장 느리게 사이에서 시작=> 이진탐색으로

시간을 구하는건데 (시간/심사시간) 을 하면 사람 수가 나옴.

이 시간을 찾아가는 것. 사람 수는 아니까 사람 수가 적으면 시간을 올려, 많으면 내려.

left와 right가 바뀌는 순간이 정답임.
