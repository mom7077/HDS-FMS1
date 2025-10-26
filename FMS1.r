检查我的代码library(openxlsx)
library(tidyverse)
library(table1)
library(ggplot2)
library(readr)

# 读取数据----------
setwd("f:/Code/R/fms1")

data <- read_csv("SHDS_Assessment1_data.csv")

colnames(data)

str(data)

# 连续性变量 BMI、AGE、MENTHEALTH
# 分类变量 DIABETES_012、HighChol

# step1 总体数据预览------
summary(data)

# step2 分类变量的探索性分析-----
## 2.1 频数-------
table(data$Diabetes_012)
table(data$Stroke)
table(data$HighChol)
table(data$Smoker)
table(data$CholCheck)
table(data$Sex)

## 2.2 频数分布图------
# 需要作图的变量
vars <- c("Diabetes_012", "Stroke", "HighChol", "Smoker", "CholCheck", "Sex")
# 转为长表，并计算频数与百分比
df_long <- data %>%
    select(all_of(vars)) %>%
    pivot_longer(everything(), names_to = "variable", values_to = "value") %>%
    # 把 value 转换成因子，并指定水平顺序和标签（0/1）
    mutate(
        value = factor(value, levels = c(0, 1), labels = c("0", "1"))
    )

freq <- df_long %>%
    count(variable, value, name = "n") %>%
    group_by(variable) %>%
    mutate(pct = n / sum(n)) %>%
    ungroup()

# 2.2.1 一个画布6张图----
ggplot(freq, aes(x = value, y = n, fill = value)) +
    geom_col() +
    geom_text(aes(label = sprintf("%d\n(%.1f%%)", n, pct * 100)),
        vjust = 0.6, size = 3
    ) +
    facet_wrap(~variable, ncol = 3, scales = "free_y") +
    labs(x = NULL, y = "Count", title = "Frequency distributions") +
    theme_grey() +
    scale_fill_manual(values = c("0" = "blue", "1" = "red")) +
    theme(strip.text = element_text(face = "bold"))

# 6个小图----
vars <- unique(freq$variable)

for (v in vars) {
    p <- ggplot(
        filter(freq, variable == v),
        aes(x = value, y = n, fill = value)
    ) +
        geom_col() +
        geom_text(aes(label = sprintf("%d\n(%.1f%%)", n, pct * 100)),
            vjust = -0.3, size = 3
        ) +
        labs(x = NULL, y = "Count", title = paste("Frequency of", v)) +
        scale_fill_manual(values = c("0" = "blue", "1" = "red")) +
        theme_bw()

    print(p)
}

# 一个画布六个组----
ggplot(freq, aes(x = variable, y = n, fill = value)) +
    geom_col(position = position_dodge(width = 0.7), width = 0.6) +
    geom_text(aes(label = sprintf("%d\n(%.1f%%)", n, pct * 100)),
        position = position_dodge(width = 0.7),
        vjust = -0.2, size = 3
    ) +
    labs(
        x = NULL, y = "Count", fill = "Value",
        title = "Frequency of six variables (ground bars)"
    ) +
    theme_bw() +
    scale_fill_manual(values = c("0" = "#8ECae6", "1" = "219EBC")) +
    theme(axis.text.x = element_text(angle = 30, hjust = 1))

# 2.2.3 百分比堆积图----
ggplot(freq, aes(x = variable, y = pct, fill = value)) +
    geom_col() +
    geom_text(aes(label = paste0(n, "(", round(pct * 100, 1), "%", ")")),
        position = position_stack(vjust = 0.5), size = 3
    ) +
    scale_y_continuous(labels = scales::percent) +
    labs(
        x = NULL, y = "Percentage", fill = "value",
        title = "Proportion of six variables (stacked)"
    ) +
    theme_classic() +
    scale_fill_manual(values = c("0" = "pink", "1" = "grey")) +
    theme(axis.text.x = element_text(angle = 30, hjust = 1))


# 2.3 table-----
vars <- c("Diabetes_012", "Stroke", "HighChol", "Smoker", "CholCheck", "Sex")

data2 <- data
for (v in vars) {
    data2[[v]] <- factor(data2[[v]], levels = c(0, 1))
}

table1(~ Diabetes_012 + Stroke + HighChol + Smoker + CholCheck + Sex, data = data2)
# 按性别分组
table1(~ Diabetes_012 + Stroke + HighChol + Smoker + CholCheck | Sex, data = data2)

# step3 连续变量的探索性分析----
## 3.1 直接summary----
summary(data$BMI)
summary(data$Age)
summary(data$MentHlth)

# 单个图形----
const_vars <- c("BMI", "Age", "MentHlth")

# 逐个变量画直方图
for (v in const_vars) {
    p <- ggplot(data, aes(x = .data[[v]])) +
        geom_histogram(bins = 30, fill = "#8ECae6", color = "white") +
        labs(title = paste("Histogram of", v), x = v, y = "Count") +
        theme_bw()
    print(p)
}

# 逐个变量画密度图
for (v in const_vars) {
    p <- ggplot(data, aes(x = .data[[v]])) +
        geom_density(fill = "#8ECae6", color = "white") +
        labs(title = paste("Density of", v), x = v, y = "Count") +
        theme_bw()
    print(p)
}


# 组合图形
const_vars <- c("BMI", "Age", "MentHlth")

data <- data %>%
    mutate(Diabetes_012 = factor(Diabetes_012, levels = c(0, 1)))

# 长表
df_long <- data %>%
    select(all_of(const_vars), Diabetes_012) %>%
    pivot_longer(cols = all_of(const_vars), names_to = "variable", values_to = "value") %>%
    drop_na(value)

## 3.2 多个变量各自的直方图（同一画布，分面）-----
ggplot(df_long, aes(x = value)) +
    geom_histogram(bins = 30) +
    facet_wrap(~variable, scales = "free", ncol = 3) +
    labs(
        x = NULL,
        y = "Count",
        title = "Histograms of BMI / AGE / MentHlth"
    ) +
    theme_bw() +
    aes(fill = variable) +
    scale_fill_brewer(palette = "Set1")

## 3.3 三个变量各自的核密度图-----
ggplot(df_long, aes(x = value, fill = variable)) +
    geom_density() +
    facet_wrap(~variable, scales = "free", ncol = 3) +
    labs(
        x = NULL,
        y = "Density",
        title = "Kernel density of BMI / Age/ MentHlth"
    ) +
    theme_bw() +
    scale_fill_brewer(palette = "Set1")

## 3.4 QQ图 ----
ggplot(df_long, aes(sample = value, colour = variable)) +
    stat_qq() +
    stat_qq_line() +
    facet_wrap(~variable, scales = "free", ncol = 3) +
    labs(
        x = "Theoretical Quantities",
        y = "Sample Quantiles",
        title = "QQ plots of BMI / Age/ MentHlth"
    ) +
    theme_bw() +
    scale_color_brewer(palette = "Dark2")

## 单个箱线图Age------
ggplot(data, aes(x = Diabetes_012, y = Age, fill = Diabetes_012)) +
    geom_boxplot(width = 0.6, outlier.alpha = 0.5) +
    labs(
        x = "Diabetes_012",
        y = "Age",
        title = "Age by Diabetes"
    ) +
    scale_fill_manual(values = c("#4CE0D2", "#F76F8E")) +
    theme_bw() +
    theme(legend.position = "none")


## 单个箱线图BMI----
ggplot(data, aes(x = Diabetes_012, y = BMI, fill = Diabetes_012)) +
    geom_boxplot(width = 0.6, outlier.alpha = 0.5) +
    labs(
        x = "Diabetes_012",
        y = "Age",
        title = "BMI by Diabetes"
    ) +
    scale_fill_manual(values = c("#4CE0D2", "#F76F8E")) +
    theme_bw() +
    theme(legend.position = "none")

## 3.5 按Diabetes_012 分组的箱线图 （每个变量一列） ----
ggplot(df_long, aes(x = Diabetes_012, y = value, fill = Diabetes_012)) +
    geom_boxplot(width = 0.6, outliers.shape = 19, outlier.alpha = 0.5) +
    facet_wrap(~variable, scales = "free_y", ncol = 3) +
    labs(
        x = "Diabetes_012",
        y = NULL,
        title = "Boxplots by Diabetes_012"
    ) +
    theme_bw() +
    scale_fill_manual(values = c("0" = "red", "1" = "green"))

## 单个小提琴 MentHlth ----
ggplot(data, aes(x = Diabetes_012, y = MentHlth, fill = Diabetes_012)) +
    geom_violin(trim = FALSE, width = 0.8, position = position_dodge(width = 0.8)) +
    geom_boxplot(width = 0.12, outlier.shape = NA, color = "red") +
    labs(
        x = "Diabetes_012",
        y = "MentHlth",
        title = "MentHlth by Diabetes Status"
    ) +
    scale_fill_manual(values = c("#8ECAE6", "#219EBC")) +
    theme_bw() +
    theme(legend.position = "none")

## 3.6 按Diabetes_012 分组的小提琴图----
ggplot(df_long, aes(x = Diabetes_012, y = value, fill = Diabetes_012)) +
    geom_violin(trim = FALSE) +
    geom_boxplot(width = 0.1, outlier.shape = NA) +
    facet_wrap(~variable, scales = "free_y", ncol = 3) +
    labs(
        x = "Diabetes_012",
        y = NULL,
        title = "violin plots by Diabetes_012"
    ) +
    theme_dark() +
    scale_fill_manual(values = c("0" = "#8ECAE6", "1" = "#219EBC"))

## 单个直方图 ------
pd <- position_dodge(width = 0.6)
stats <- df_long %>%
    group_by(variable, Diabetes_012) %>%
    summarise(
        n = n(),
        mean = mean(value),
        sd = sd(value),
        se = sd / sqrt(n),
        .groups = "drop"
    )

vars <- c("BMI", "Age", "MentHlth")
for (v in vars) {
    s <- dplyr::filter(stats, variable == v)

    p <- ggplot(s, aes(x = variable, y = mean, fill = Diabetes_012, color = Diabetes_012)) +
        geom_col(position = pd, width = 0.55) +
        geom_errorbar(aes(ymin = mean - sd, ymax = mean + sd),
            position = pd, width = 0.18, linewidth = 0.6
        ) +
        labs(
            x = NULL,
            y = "Mean(±SD)",
            title = paste0(v, "by Diabetes_012")
        ) +
        theme_bw() +
        scale_fill_manual(values = c("0" = "red", "1" = "green")) +
        scale_color_manual(values = c("0" = "red", "1" = "green"))
    print(p)
}

## 3.7 直方图+误差线： 按Diabetes_012 分组叠加直方图， 画均值SD竖线----
ggplot(stats, aes(x = variable, y = mean, fill = Diabetes_012, color = Diabetes_012)) +
    geom_col(position = pd, width = 0.55) +
    geom_point(position = pd, size = 2, color = "black") +
    geom_errorbar(aes(ymin = mean - sd, ymax = mean + sd),
        position = pd, width = 0.18, linewidth = 0.6
    ) +
    labs(
        x = NULL,
        y = "Mean(+-SD)"
    ) +
    theme_bw() +
    scale_fill_manual(values = c("0" = "red", "1" = "green")) +
    scale_color_manual(values = c("0" = "red", "1" = "green"))


## BMI、Age和Diabetes_012的潜在关系 -----
ggplot(data, aes(x = Age, y = BMI, color = factor(Diabetes_012))) +
    geom_point(alpha = 0.7) +
    ggtitle("BMI and Age by Diabetes Status") +
    xlab("Age") +
    ylab("BMI") +
    scale_color_manual(
        name = "Diabetes",
        breaks = c("0", "1"),
        values = c(
            "0" = "red",
            "1" = "green"
        )
    ) +
    theme_classic()
