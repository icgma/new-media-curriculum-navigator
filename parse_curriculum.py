#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
培养方案解析器
用于解析网络与新媒体专业培养方案HTML文档，提取课程信息和前置关系
"""

import json
import re
from bs4 import BeautifulSoup

def parse_curriculum_html(html_file):
    """解析培养方案HTML文件，提取课程信息"""

    with open(html_file, 'r', encoding='gb2312') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')

    courses = {}

    # 查找所有表格行
    rows = soup.find_all('tr')

    current_course_type = ""

    for row in rows:
        cells = row.find_all('td')
        if len(cells) >= 7:  # 确保有足够的列
            # 检查是否是课程类型标题行
            if len(cells) == 1 and cells[0].get('colspan'):
                text = cells[0].get_text(strip=True)
                if '专业基础课' in text:
                    current_course_type = "专业基础课"
                elif '专业必修课' in text:
                    current_course_type = "专业必修课"
                elif '专业选修课' in text:
                    current_course_type = "专业选修课"
                elif '实践环节' in text:
                    current_course_type = "实践环节"
                elif '公共必修课' in text:
                    current_course_type = "公共必修课"
                elif '外语课程' in text:
                    current_course_type = "外语课程"
                elif '计算机基础' in text:
                    current_course_type = "计算机基础"
                continue

            # 提取课程信息
            course_code = cells[0].get_text(strip=True)
            course_name = cells[1].get_text(strip=True)
            course_nature = cells[2].get_text(strip=True)
            credits = cells[3].get_text(strip=True)
            hours = cells[4].get_text(strip=True)
            semester = cells[5].get_text(strip=True) if len(cells) > 5 else ""
            prerequisites = cells[6].get_text(strip=True) if len(cells) > 6 else ""

            # 过滤掉无效的课程代码
            if not re.match(r'^[A-Z]{3}\d+[A-Z]?$', course_code):
                continue

            # 解析学分
            try:
                credits_num = float(credits)
            except:
                credits_num = 0.0

            # 解析学时
            try:
                hours_num = int(re.findall(r'\d+', hours)[0]) if re.findall(r'\d+', hours) else 0
            except:
                hours_num = 0

            # 确定课程组和子组
            if course_code.startswith('ELC'):
                course_group = "公共课"
                course_subgroup = "外语课程"
            elif course_code.startswith('COM'):
                course_group = "公共课"
                course_subgroup = "计算机基础课程"
            elif course_code.startswith('XSC') or course_code.startswith('SOC'):
                course_group = "公共课"
                course_subgroup = "公共必修课程"
            elif course_code.startswith('PED') or course_code.startswith('AED') or course_code.startswith('RTP'):
                course_group = "公共课"
                course_subgroup = "通选课程"
            elif course_code.startswith('MAT'):
                course_group = "专业课程"
                course_subgroup = "专业必修课"
            else:
                course_group = "专业课程"
                if current_course_type == "专业基础课":
                    course_subgroup = "专业基础课"
                elif current_course_type == "专业必修课":
                    course_subgroup = "专业必修课"
                elif current_course_type == "专业选修课":
                    course_subgroup = "专业选修课"
                elif current_course_type == "实践环节":
                    course_subgroup = "实践环节"
                else:
                    course_subgroup = "专业课程"

            # 解析前置课程
            prereq_list = []
            if prerequisites and prerequisites != '无' and prerequisites.strip():
                # 提取课程代码
                prereq_codes = re.findall(r'[A-Z]{3}\d+[A-Z]?', prerequisites)
                prereq_list = prereq_codes

            courses[course_code] = {
                "code": course_code,
                "name": course_name,
                "credits": credits_num,
                "hours": hours_num,
                "semester": semester,
                "course_type": course_nature,
                "course_group": course_group,
                "course_subgroup": course_subgroup,
                "prerequisites": prereq_list,
                "description": f"{course_name}相关理论和实践知识"
            }

    return courses

def main():
    # 解析HTML文件
    courses = parse_curriculum_html('【9-4-1】网络与新媒体专业培养方案1024.htm')

    # 创建完整的数据结构
    curriculum_data = {
        "courses": courses,
        "metadata": {
            "total_courses": len(courses),
            "source_file": "【9-4-1】网络与新媒体专业培养方案1024.htm",
            "semesters": sorted(list(set([course["semester"] for course in courses.values() if course["semester"]]))),
            "course_types": sorted(list(set([course["course_type"] for course in courses.values()]))),
            "course_groups": sorted(list(set([course["course_group"] for course in courses.values()]))),
            "course_subgroups": sorted(list(set([course["course_subgroup"] for course in courses.values()])))
        }
    }

    # 保存到JSON文件
    with open('curriculum_data_real.json', 'w', encoding='utf-8') as f:
        json.dump(curriculum_data, f, ensure_ascii=False, indent=2)

    print(f"成功解析 {len(courses)} 门课程")
    print("课程类型:", curriculum_data["metadata"]["course_types"])
    print("课程组:", curriculum_data["metadata"]["course_groups"])
    print("课程子组:", curriculum_data["metadata"]["course_subgroups"])

    # 统计各类课程数量
    type_count = {}
    group_count = {}
    subgroup_count = {}

    for course in courses.values():
        type_count[course["course_type"]] = type_count.get(course["course_type"], 0) + 1
        group_count[course["course_group"]] = group_count.get(course["course_group"], 0) + 1
        subgroup_count[course["course_subgroup"]] = subgroup_count.get(course["course_subgroup"], 0) + 1

    print("\n课程类型统计:")
    for t, count in type_count.items():
        print(f"  {t}: {count}门")

    print("\n课程组统计:")
    for g, count in group_count.items():
        print(f"  {g}: {count}门")

    print("\n课程子组统计:")
    for sg, count in subgroup_count.items():
        print(f"  {sg}: {count}门")

    # 打印前几门课程作为示例
    print("\n前10门课程示例:")
    for i, (code, course) in enumerate(courses.items()):
        if i >= 10:
            break
        print(f"{code}: {course['name']} ({course['credits']}学分, {course['semester']}, {course['course_subgroup']})")

if __name__ == "__main__":
    main()

