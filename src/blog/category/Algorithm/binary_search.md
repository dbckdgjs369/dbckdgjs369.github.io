---
layout: post
slug: "/category/Algorithm/binary_search"
title: Javascript로 이진탐색 만들기
tags: [Algorithm, Binary-Search]
category: [Algorithm]
---

## 알고리즘 강의

### 이진 탐색

시간 복잡도 O(log n)의 가장 빠른 탐색, but 정렬되어 있을 때만 사용 가능.

    function binarySearch(array, findValue) {
        let left = 0;
        let right = array.length - 1;
        let mid = Math.floor((left + right) / 2);
        while (left < right) {
            if (array[mid] === findValue) {
            return mid;
            }

            if (array[mid] < findValue) {
            left = mid + 1;
            } else {
            right = mid - 1;
            }
            mid = Math.floor((left + right) / 2);
        }
        return -1;
    }
