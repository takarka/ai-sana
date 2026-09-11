using CraftAi.Modules.Pisa.Domain;
using CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

namespace CraftAi.Modules.Pisa.UnitTests;

public sealed class ItemRequestValidatorTests
{
    [Fact]
    public void Validate_КорректныеПоля_Успех()
    {
        var result = ItemRequestValidator.Validate("Стимул", "math", 3, 15, 5, 7, questionCount: 1);

        Assert.True(result.IsSuccess);
        Assert.Equal(ItemDirection.Math, result.Value);
    }

    [Fact]
    public void Validate_ПустойСтимул_Отказ()
    {
        var result = ItemRequestValidator.Validate("", "math", 3, 15, 5, 7, questionCount: 1);

        Assert.True(result.IsFailure);
        Assert.Equal("item.stimulus-text-required", result.Error!.Code);
    }

    [Fact]
    public void Validate_НераспознанноеНаправление_Отказ()
    {
        var result = ItemRequestValidator.Validate("Стимул", "geography", 3, 15, 5, 7, questionCount: 1);

        Assert.True(result.IsFailure);
        Assert.Equal("item.invalid-direction", result.Error!.Code);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(7)]
    public void Validate_УровеньВнеШкалы_Отказ(int level)
    {
        var result = ItemRequestValidator.Validate("Стимул", "science", level, 15, 5, 7, questionCount: 1);

        Assert.True(result.IsFailure);
        Assert.Equal("item.invalid-level", result.Error!.Code);
    }

    [Fact]
    public void Validate_НулевоеВремя_Отказ()
    {
        var result = ItemRequestValidator.Validate("Стимул", "reading", 3, 0, 5, 7, questionCount: 1);

        Assert.True(result.IsFailure);
        Assert.Equal("item.invalid-expected-time", result.Error!.Code);
    }

    [Theory]
    [InlineData(0, 5)]
    [InlineData(5, 12)]
    [InlineData(8, 5)]
    public void Validate_НекорректныйДиапазонПараллелей_Отказ(int min, int max)
    {
        var result = ItemRequestValidator.Validate("Стимул", "reading", 3, 15, min, max, questionCount: 1);

        Assert.True(result.IsFailure);
        Assert.Equal("item.invalid-grade-range", result.Error!.Code);
    }

    [Fact]
    public void Validate_БезВопросов_Отказ()
    {
        var result = ItemRequestValidator.Validate("Стимул", "math", 3, 15, 5, 7, questionCount: 0);

        Assert.True(result.IsFailure);
        Assert.Equal("item.questions-required", result.Error!.Code);
    }
}
